import type { NearbyScan, OpeningHours, PlaceObservation, QueryPlan, RoadEvidence } from '../domain/activity-types';
import type { Route } from '../domain/types';
import type { TutorialScenario } from './tutorial';

// Fixed, visible tutorial clock. These are independent fixtures, not provider data.
export const TUTORIAL_CHECKED_AT='2026-09-09T15:00:00Z';
const open:OpeningHours={timeZone:'Asia/Kolkata',alwaysOpen:true};
const closed:OpeningHours={timeZone:'Asia/Kolkata',periods:[{openDay:3,openMinute:9*60,closeDay:3,closeMinute:17*60}]};
const closing:OpeningHours={timeZone:'Asia/Kolkata',periods:[{openDay:3,openMinute:18*60,closeDay:3,closeMinute:20*60+35}]};

export function fixtureScans(plan:QueryPlan,scenario:TutorialScenario):NearbyScan[]{
  const routeSamples=Object.values(plan.samplesByRoute);
  const scans:NearbyScan[]=plan.queries.map((query,index)=>{
    const references=routeSamples.flatMap((samples,routeIndex)=>samples.flatMap((sample,sampleIndex)=>sample.queryId===query.id?[{routeIndex,sampleIndex}]:[]));
    const active=scenario==='similar'||references.some(ref=>ref.routeIndex>0||ref.sampleIndex%6===0);
    const status=scenario==='unknown'?'failed':scenario==='limited'&&index%3===0?'failed':scenario==='capped'&&index%7===0?'capped':'ok';
    const hours=scenario==='closing'&&active?closing:active?open:closed;
    const categories=index%4===0?[index%8===0?'gas_station':'pharmacy']:index%4===1?['transit_station']:['store'];
    const primary:PlaceObservation={id:`sample:place:${index}`,coordinate:{...query.coordinate},categories,hours,observedAt:TUTORIAL_CHECKED_AT};
    const places=[primary];
    return {queryId:query.id,observedAt:TUTORIAL_CHECKED_AT,status,places:status==='failed'?[]:places};
  });
  // Repeated query results preserve the original listing's hours and categories.
  // The analyzer decides whether it is inside the neighbouring search radius.
  for(let i=1;i<scans.length;i++)if(i%5===0&&scans[i].status!=='failed'&&scans[i-1].places[0])scans[i].places.push(structuredClone(scans[i-1].places[0]));
  return scans;
}

// Invented tutorial inputs only. Never apply these road shares or turn rates to
// provider routes, or present them as measurements of Bengaluru roads.
export function fixtureRoadEvidence(routes:Route[],scenario:TutorialScenario):Record<string,RoadEvidence>{
  return Object.fromEntries(routes.filter(r=>r.source==='sample').map((r,index)=>[r.id,{
    mainRoadFraction:scenario==='similar'?.7:index===0?.4:.8,
    maneuversPerKm:scenario==='similar'?2:index===0?4:1.5,
  }]));
}
