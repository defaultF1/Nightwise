import type { Route } from '../src/domain/types';
import type { NearbyQuery, NearbyScan, QueryPlan } from '../src/domain/activity-types';
import { buildQueryPlan } from '../src/domain/activity';
import { distanceMeters } from '../src/domain/geometry';
import type { GoogleProvider } from './google';

// Spread the finite budget over every route. Omitted samples remain in the plan
// and are consequently unknown; never shrink radii to manufacture completeness.
export function balancedPlan(routes:Route[], limit:number):QueryPlan {
  const full=buildQueryPlan(routes,200,1000);
  const queries=new Map(full.queries.map(q=>[q.id,q]));
  function order(ids:string[]):string[]{
    if(ids.length<=2)return ids;
    const out=[ids[0],ids.at(-1)!], queue:[[number,number]]|[number,number][]=[[1,ids.length-2]];
    while(queue.length){const [lo,hi]=queue.shift()!;if(lo>hi)continue;const mid=Math.floor((lo+hi)/2);out.push(ids[mid]);queue.push([lo,mid-1],[mid+1,hi]);}
    return out;
  }
  const lists=routes.map(r=>order(full.samplesByRoute[r.id].map(s=>s.queryId)));
  const selected=new Set<string>();
  for(let i=0;lists.some(l=>i<l.length)&&selected.size<limit;i++)for(const list of lists){if(list[i]&&selected.size<limit)selected.add(list[i]);}
  return {...full,queries:[...selected].map(id=>queries.get(id)!)};
}
export function coveringChildren(q:NearbyQuery):NearbyQuery[]{
  const radians=q.coordinate.latitude*Math.PI/180;
  return [-1,1].flatMap(x=>[-1,1].map(y=>({...q,id:`${q.id}:child:${x}:${y}`,coordinate:{latitude:q.coordinate.latitude+y*q.radiusMeters/2/111195,longitude:q.coordinate.longitude+x*q.radiusMeters/2/(111195*Math.cos(radians))},radiusMeters:q.radiusMeters/Math.sqrt(2)+1})));
}
export async function collectScans(plan:QueryPlan, provider:Pick<GoogleProvider,'nearby'>, signal:AbortSignal, maxCalls:number){
  const scans:NearbyScan[]=[];const attributions:{name:string;uri?:string}[]=[];
  let calls=0,next=0,refined=0;
  await Promise.all(Array.from({length:Math.min(3,plan.queries.length)},async()=>{
    while(!signal.aborted){const q=plan.queries[next++];if(!q||calls>=maxCalls)return;calls++;
      try{const result=await provider.nearby(q,signal);scans.push(result.scan);attributions.push(...result.attributions);}
      catch{scans.push({queryId:q.id,observedAt:new Date().toISOString(),status:'failed',places:[]});}
    }
  }));
  // First split the same geographic footprint by an exhaustive category partition.
  // Two complete subsearches recover a capped parent at half the subdivision cost.
  // Failed or capped subsearches never make the parent complete.
  const partitions=new Map<string,{query:NearbyQuery;scan:NearbyScan}[]>();
  for(const parent of plan.queries){
    if(signal.aborted||calls+2>maxCalls)break;
    const index=scans.findIndex(s=>s.queryId===parent.id&&s.status==='capped');if(index<0)continue;
    const parts=await Promise.all((['places','help'] as const).map(async partition=>{
      const query={...parent,id:`${parent.id}:types:${partition}`,partition};calls++;
      try{const result=await provider.nearby(query,signal);attributions.push(...result.attributions);return {query,scan:result.scan};}
      catch{return {query,scan:{queryId:query.id,status:'failed' as const,observedAt:new Date().toISOString(),places:[]}};}
    }));
    partitions.set(parent.id,parts);
    scans[index]={...scans[index],status:parts.every(p=>p.scan.status==='ok')?'ok':'capped',places:[...scans[index].places,...parts.flatMap(p=>p.scan.places)]};
    refined++;
  }
  // Remaining allowance refines capped category footprints, in balanced order.
  for(const parent of plan.queries){
    if(signal.aborted||calls+4>maxCalls)break;
    const index=scans.findIndex(s=>s.queryId===parent.id&&s.status==='capped');if(index<0)continue;
    const parts=partitions.get(parent.id);
    const target=parts?.find(p=>p.scan.status==='capped');
    if(parts&&!target)continue;
    const children:NearbyScan[]=[];
    for(const child of coveringChildren(target?.query??parent)){
      if(signal.aborted)break;calls++;
      try{const result=await provider.nearby(child,signal);children.push(result.scan);attributions.push(...result.attributions);}
      catch{children.push({queryId:child.id,status:'failed',observedAt:new Date().toISOString(),places:[]});}
    }
    const childComplete=children.length===4&&children.every(s=>s.status==='ok');
    const complete=childComplete&&(!parts||parts.every(p=>p===target||p.scan.status==='ok'));
    const places=[...scans[index].places,...children.flatMap(s=>s.places)].filter(p=>distanceMeters(p.coordinate,parent.coordinate)<=parent.radiusMeters+1);
    scans[index]={queryId:parent.id,observedAt:new Date().toISOString(),status:complete?'ok':'capped',places:[...new Map(places.map(p=>[JSON.stringify({...p,observedAt:undefined}),p])).values()]};
    refined++;
  }
  return {scans,attributions,calls,refined};
}
