import type { ActivityAnalysis, Comparison, Component, RoadEvidence } from './activity-types';
import type { Route } from './types';
import { HELP_CATEGORIES, STAFFED_PROXY_CATEGORIES } from './activity';

type Interval = [number, number];
const weights: Record<Component, number> = {openDensity:25,mainRoad:20,helpDensity:15,gapContinuity:15,simplicity:15,transport:10};
const keys = Object.keys(weights) as Component[];
const clamp = (v:number) => Math.max(0,Math.min(1,v));
const transport = new Set(['transit_station','bus_station','bus_stop','train_station','subway_station','light_rail_station']);
export function liveComponentBounds(a:ActivityAnalysis, road:RoadEvidence):Record<Component,Interval> {
  const km=a.distanceMeters/1000;
  const result=Object.fromEntries(keys.map(k=>[k,[0,1]])) as Record<Component,Interval>;
  if(!(km>0)||a.openPlaces===null)return result;
  // Only confidently scheduled-open observations support the lower bound.
  // Missing discovery is allowed the entire normalized component range.
  const density=(categories:Set<string>|null, scale:number):Interval=>{
    const places=a.places.filter(p=>!categories||p.categories.some(c=>categories.has(c)));
    const lower=places.filter(p=>!p.conflict&&p.hours.state==='open'&&!p.hours.closingSoon).length;
    const possible=places.filter(p=>p.conflict||p.hours.state!=='closed').length;
    return [clamp(lower/km/scale),a.scanCoverage>=1-1e-9?clamp(possible/km/scale):1];
  };
  result.openDensity=density(null,8);
  result.transport=density(transport,3);
  const help=density(HELP_CATEGORIES,2), staffed=density(STAFFED_PROXY_CATEGORIES,8);
  const hg=a.helpGapBounds??[a.longestObservedHelpGapMeters,a.longestHelpGapMeters??a.distanceMeters];
  result.helpDensity=[(.75*help[0]+.25*staffed[0])*(1-.5*clamp(hg[1]/2000)),(.75*help[1]+.25*staffed[1])*(1-.5*clamp(hg[0]/2000))];
  const gap=a.lowActivityGapBounds??[a.longestObservedLowActivityMeters,a.longestLowActivityMeters??a.distanceMeters];
  result.gapContinuity=[1-clamp(gap[1]/1500),1-clamp(gap[0]/1500)];
  const length=(road.mainMeters??0)+(road.internalMeters??0)+(road.unknownMeters??0);
  if(length>0)result.mainRoad=[clamp((road.mainMeters??0)/length),clamp(((road.mainMeters??0)+(road.unknownMeters??length))/length)];
  else if(Number.isFinite(road.mainRoadFraction))result.mainRoad=[clamp(road.mainRoadFraction!),clamp(road.mainRoadFraction!)];
  if(Number.isFinite(road.maneuversPerKm)&&road.maneuversPerKm!>=0){
    const turns=road.maneuversPerKm!;
    const internal=road.internalTurnsPerKm;
    result.simplicity=Number.isFinite(internal)&&internal!>=0?[1-clamp((turns+internal!)/10),1-clamp((turns+internal!)/10)]:[1-clamp(2*turns/10),1-clamp(turns/10)];
  }
  return result;
}

export function compareLive(routes:Route[], analyses:ActivityAnalysis[], roads:Record<string,RoadEvidence>, base:Comparison, maxExtra=10):Comparison {
  const byId=new Map(analyses.map(a=>[a.routeId,a]));
  const times=new Set(routes.map(r=>byId.get(r.id)?.checkedAt));
  if(times.size!==1||!routes.every(r=>r.source==='google'&&byId.get(r.id)?.source==='live'&&Number.isFinite(Date.parse(byId.get(r.id)!.checkedAt))))
    return {...base,outcome:'insufficient',message:'These routes do not share a valid evidence check. Refresh the comparison.'};
  const componentBounds:NonNullable<Comparison['componentBounds']>={}, scoreBounds:NonNullable<Comparison['scoreBounds']>={}, scores:Comparison['scores']={}, componentScores:Comparison['componentScores']={};
  for(const route of routes){
    const a=byId.get(route.id)!;
    if(a.openPlaces===null)continue;
    const bounds=liveComponentBounds(a,roads[route.id]??{});
    componentBounds[route.id]=bounds;
    scoreBounds[route.id]=[Math.min(100,keys.reduce((s,k)=>s+weights[k]*bounds[k][0],0)),Math.min(100,keys.reduce((s,k)=>s+weights[k]*bounds[k][1],0))];
    scores[route.id]=scoreBounds[route.id][0];
    componentScores[route.id]=Object.fromEntries(keys.map(k=>[k,bounds[k][0]]));
  }
  const scored={...base,version:'experimental-live-activity-v4-bounds',scores,scoreBounds,componentBounds,componentScores,commonComponents:keys,rankedIds:[]};
  if(!Object.keys(scores).length)return {...scored,outcome:'insufficient',message:'No usable shop observations were returned. Refresh when the service is available.'};
  if(routes.length===1)return {...scored,outcome:'single',message:'One route was returned. Its score range reflects missing evidence; no alternative is available.'};
  const fastest=routes.find(r=>r.id===base.fastestId)!;
  const extra=Number.isFinite(maxExtra)?Math.max(0,Math.min(30,maxExtra)):10;
  const eligible=routes.filter(r=>r.durationSeconds-fastest.durationSeconds<=extra*60);
  const winner=eligible.find(r=>scoreBounds[r.id]&&eligible.every(other=>other.id===r.id||(scoreBounds[other.id]&&scoreBounds[r.id][0]>=scoreBounds[other.id][1]+10)));
  if(eligible.length<2)return {...scored,outcome:'detour',message:`Only the fastest route fits your ${extra}-minute extra-time preference. Other routes remain selectable.`};
  if(!winner)return {...scored,outcome:'insufficient',message:'Live activity scores are shown as ranges. They overlap or evidence is missing, so the fastest route stays selected. Choose a route using its travel time and listed help points.'};
  const minutes=Math.ceil((winner.durationSeconds-fastest.durationSeconds)/60);
  const reference=winner.id===fastest.id?eligible.filter(r=>r.id!==winner.id).sort((a,b)=>scoreBounds[b.id][1]-scoreBounds[a.id][1])[0]:fastest;
  const labels:Record<Component,string>={openDensity:'more confirmed-open listings per kilometre',mainRoad:'a larger supported main-road share',helpDensity:'stronger help-point evidence',gapContinuity:'shorter stretches with few open listings',simplicity:'fewer turns and internal-road turns',transport:'more transport locations listed as open'};
  const reasons=keys.map(k=>({key:k,gain:weights[k]*(componentBounds[winner.id][k][0]-componentBounds[reference.id][k][1])})).filter(g=>g.gain>1).sort((a,b)=>b.gain-a.gain).slice(0,3).map(g=>labels[g.key]);
  const explanation=reasons.length?` It has ${reasons.join(', ')} compared with ${reference.label.toLowerCase()}.`:'';
  return {...scored,outcome:'more-activity',selectedId:winner.id,recommendedId:winner.id,
    message:(minutes?`For ${minutes} extra minutes, this route has a stronger listed-activity score even after allowing for missing evidence.`:'The fastest route also has stronger listed-activity evidence across the supported score ranges.')+explanation};
}
