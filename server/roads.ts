import { readFileSync, statSync } from 'node:fs';
import {dirname,join} from 'node:path';
import { createRoadAnalyzer, type RoadWay } from '../src/domain/roads';
import { inServiceMapArea } from '../src/domain/journey';
import { samplePolyline } from '../src/domain/geometry';
import type { Coordinate } from '../src/domain/types';
const cached=new Map<string,{stamp:string;analyze:ReturnType<typeof createRoadAnalyzer>}>();
export function loadRoadAnalyzer(file: string, paths?: Coordinate[][]) {
  try {
    // Index only tiles around this comparison, keeping the expanded city extract
    // usable on the small hosted server. Whole ways crossing a tile are retained.
    const tiles=new Set<string>();
    for(const path of paths??[])for(const {coordinate:p} of samplePolyline(path,250,5000)){
      const x=Math.floor(p.longitude/.005),y=Math.floor(p.latitude/.005);
      for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)tiles.add(`${x+dx}:${y+dy}`);
    }
    const stat=statSync(file),stamp=`${stat.mtimeMs}:${stat.size}:${[...tiles].sort().join('|')}`;
    if (stat.size>65_000_000) throw new Error('Oversized road extract');
    if(cached.get(file)?.stamp===stamp)return cached.get(file)!.analyze;
    // Retain only the active city index on the small hosted instance.
    cached.clear();
    const data=JSON.parse(readFileSync(file,'utf8'));
    if(data.format==='nightwise-road-tiles-v1'){
      if(!tiles.size||data.tileSize!==.025||!Array.isArray(data.tiles)||data.tiles.length>2000||!/^[-a-z0-9]+$/.test(data.directory))throw new Error('Invalid tiled extract');
      const needed=new Set<string>();
      for(const key of tiles){const [x,y]=key.split(':').map(Number);for(const dx of [0,1])for(const dy of [0,1])needed.add(`${Math.floor((x+dx)*.005/data.tileSize)}_${Math.floor((y+dy)*.005/data.tileSize)}`);}
      const ways=new Map<number,any>();let bytes=0;
      for(const key of data.tiles){
        if(typeof key!=='string'||!/^\d+_\d+$/.test(key))throw new Error('Invalid road tile');
        if(!needed.has(key))continue;
        const tileFile=join(dirname(file),data.directory,`${key}.json`);
        bytes+=statSync(tileFile).size;if(bytes>65_000_000)throw new Error('Comparison road tiles too large');
        const tile=JSON.parse(readFileSync(tileFile,'utf8'));
        if(!Array.isArray(tile.elements))throw new Error('Invalid road tile');
        for(const way of tile.elements)ways.set(way.id,way);
      }
      data.elements=[...ways.values()];
    }
    if(data.remark||!Array.isArray(data.elements)||data.elements.length>250000||(!tiles.size&&data.elements.length>65000)) throw new Error('Invalid road extract');
    let points=0;
    const ways:RoadWay[]=data.elements.flatMap((w:any)=>{
      if(w.type!=='way'||!Number.isSafeInteger(w.id)||typeof w.tags?.highway!=='string'||!Array.isArray(w.geometry))return [];
      const path=w.geometry.map((p:any)=>({latitude:p.lat,longitude:p.lon})); points+=path.length;
      if(points>1500000)throw new Error('Road extract too detailed');
      if(path.length<2||path.some((p:any)=>!inServiceMapArea(p)))return [];
      if(tiles.size&&!path.some((p:Coordinate,i:number)=>{
        if(!i)return false;
        const a=path[i-1],west=Math.floor(Math.min(a.longitude,p.longitude)/.005),east=Math.floor(Math.max(a.longitude,p.longitude)/.005),south=Math.floor(Math.min(a.latitude,p.latitude)/.005),north=Math.floor(Math.max(a.latitude,p.latitude)/.005);
        if((east-west+1)*(north-south+1)>400)return false;
        for(let x=west;x<=east;x++)for(let y=south;y<=north;y++)if(tiles.has(`${x}:${y}`))return true;
        return false;
      }))return [];
      return [{id:w.id,highway:w.tags.highway,path,gradeSeparated:(w.tags.bridge&&w.tags.bridge!=='no')||(w.tags.tunnel&&w.tags.tunnel!=='no')||Number(w.tags.layer||0)!==0}];
    });
    const analyze=createRoadAnalyzer(ways,data.osm3s?.timestamp_osm_base);
    cached.set(file,{stamp,analyze});return analyze;
  } catch { return createRoadAnalyzer([]); }
}
