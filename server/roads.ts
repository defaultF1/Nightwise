import { readFileSync, statSync } from 'node:fs';
import { createRoadAnalyzer, type RoadWay } from '../src/domain/roads';
import { inBengaluru } from '../src/domain/journey';
export function loadRoadAnalyzer(file: string) {
  try {
    if (statSync(file).size>30_000_000) throw new Error('Oversized road extract');
    const data=JSON.parse(readFileSync(file,'utf8'));
    if(data.remark||!Array.isArray(data.elements)||data.elements.length>65000) throw new Error('Invalid road extract');
    let points=0;
    const ways:RoadWay[]=data.elements.flatMap((w:any)=>{
      if(w.type!=='way'||!Number.isSafeInteger(w.id)||typeof w.tags?.highway!=='string'||!Array.isArray(w.geometry))return [];
      const path=w.geometry.map((p:any)=>({latitude:p.lat,longitude:p.lon})); points+=path.length;
      if(points>350000)throw new Error('Road extract too detailed');
      if(path.length<2||path.some((p:any)=>!inBengaluru(p)))return [];
      return [{id:w.id,highway:w.tags.highway,path,gradeSeparated:(w.tags.bridge&&w.tags.bridge!=='no')||(w.tags.tunnel&&w.tags.tunnel!=='no')||Number(w.tags.layer||0)!==0}];
    });
    return createRoadAnalyzer(ways,data.osm3s?.timestamp_osm_base);
  } catch { return createRoadAnalyzer([]); }
}
