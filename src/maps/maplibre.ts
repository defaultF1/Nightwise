import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
// Vite must bundle the MapLibre v6 worker explicitly for GeoJSON route layers.
maplibregl.setWorkerUrl(workerUrl);
import './maplibre.css';
import type { MapHandle, MapLine } from './adapter';
import type { Theme } from '../theme';
import type { Coordinate } from '../domain/types';
import type { GapMarker } from '../domain/gap-markers';
import { PIN_COLORS, type PlacePin } from './pins';
const ll=(p:Coordinate):[number,number]=>[p.longitude,p.latitude];
export async function createMapLibre(element:HTMLElement,theme:Theme,onSelect:(id:string)=>void,center:Coordinate):Promise<MapHandle>{
 const style=theme==='light'?'positron':theme==='blue'?'dark-matter-brown':'dark-matter';
 // Retina tiles cover the same 256 CSS-pixel area with 512 physical pixels.
 // Use a new URL so old low-resolution browser cache entries cannot be reused.
 const map=new maplibregl.Map({container:element,center:ll(center),zoom:13,maxZoom:20,minZoom:9,attributionControl:false,cooperativeGestures:true,
  style:{version:8,sources:{streets:{type:'raster',tiles:[`${location.origin}/api/tiles/${style}/{z}/{x}/{y}?scale=2`],tileSize:256,bounds:[77.39,12.86,77.81,13.27],maxzoom:20}},layers:[{id:'streets',type:'raster',source:'streets'}]}});
 map.addControl(new maplibregl.AttributionControl({compact:true,customAttribution:['<a href="https://www.geoapify.com/" target="_blank" rel="noopener">Geoapify</a>','<a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a>','<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>']}));
 const resize=new ResizeObserver(()=>map.resize());resize.observe(element);
 try{await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Map timed out')),45000);map.once('load',()=>{clearTimeout(timer);resolve();});map.once('error',()=>{clearTimeout(timer);reject(new Error('Map tiles unavailable'));});});}
 catch(e){resize.disconnect();map.remove();throw e;}
 let markers:maplibregl.Marker[]=[],lineIds:string[]=[];
 const mark=(p:Coordinate,name:string,kind:keyof typeof PIN_COLORS,text:string,status?:string,sourceUrl?:string)=>{
  const el=document.createElement('button');el.type='button';el.className='nightwise-map-pin';el.style.backgroundColor=PIN_COLORS[kind];el.textContent=text;el.setAttribute('aria-label',`${name}${status?' · '+status:''}`);
  const card=document.createElement('div'),title=document.createElement('strong');title.textContent=name;card.append(title);
  if(status){const info=document.createElement('p');info.textContent=status;card.append(info);}
  if(sourceUrl?.startsWith('https://')){const link=document.createElement('a');link.href=sourceUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent='View source';card.append(link);}
  const marker=new maplibregl.Marker({element:el,anchor:'center'}).setLngLat(ll(p)).setPopup(new maplibregl.Popup({offset:18,maxWidth:'240px'}).setDOMContent(card)).addTo(map);markers.push(marker);
 };
 map.on('click',e=>{const hit=map.queryRenderedFeatures(e.point,{layers:lineIds}).find(f=>f.properties?.clickable);if(hit)onSelect(String(hit.properties.routeId));});
 return {
  async draw(lines:MapLine[],pins:({name:string}&Coordinate)[],gaps:GapMarker[]=[],places:PlacePin[]=[]){
   for(const id of lineIds){if(map.getLayer(id))map.removeLayer(id);if(map.getSource(id))map.removeSource(id);}lineIds=[];
   markers.forEach(m=>m.remove());markers=[];
   lines.forEach((line,i)=>{const id=`route-${i}`;map.addSource(id,{type:'geojson',data:{type:'Feature',properties:{routeId:line.id,clickable:line.clickable},geometry:{type:'LineString',coordinates:line.path.map(ll)}}});map.addLayer({id,type:'line',source:id,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':line.color,'line-width':line.width}});lineIds.push(id);});
   places.forEach(p=>mark(p,p.name,p.kind,p.kind==='hospital'?'H':p.kind==='medical'?'+':p.kind==='fuel'?'F':'S',p.status??'Listed open around arrival',p.sourceUrl));
   gaps.forEach(p=>mark(p,`${p.label} · ${p.name}`,'gap','!'));
   pins.forEach((p,i)=>mark(p,p.name,i?'destination':'start',i?'B':'A'));
  },
  async fit(points){if(points.length){const bounds=new maplibregl.LngLatBounds();points.forEach(p=>bounds.extend(ll(p)));map.fitBounds(bounds,{padding:45,duration:0,maxZoom:16});}},
  async touch(enabled,expanded=false){if(enabled){map.dragPan.enable();map.scrollZoom.enable();map.touchZoomRotate.enable();map.keyboard.enable();}else{map.dragPan.disable();map.scrollZoom.disable();map.touchZoomRotate.disable();map.keyboard.disable();}if(expanded)map.cooperativeGestures.disable();else map.cooperativeGestures.enable();map.resize();},
  async destroy(){resize.disconnect();markers.forEach(m=>m.remove());map.remove();}
 };
}
