import type { Route } from './types';
import type { ActivityAnalysis, Comparison, Component, RoadEvidence, CameraEvidence } from './activity-types';
import { assumedShopHours } from './assumed-hours';
import type { LiveJourney } from './journey';
import { HELP_CATEGORIES, STAFFED_PROXY_CATEGORIES } from './activity';

export const SCORE_VERSION='night-activity-v8-weighted-listings';
export const WEIGHTS:Record<Component,number>={openDensity:25,mainRoad:15,helpDensity:15,gapContinuity:15,simplicity:10,transport:10,cameras:10};
export const WALK_WEIGHTS:Record<Component,number>={openDensity:25,mainRoad:0,helpDensity:25,gapContinuity:25,simplicity:5,transport:10,cameras:10};
export const ESTIMATED_OPEN_CREDIT=.35;
export const scoreWeights=(mode:LiveJourney['mode']='DRIVE')=>mode==='WALK'?WALK_WEIGHTS:WEIGHTS;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const nonnegative=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
// Gradual saturation: eight places/km earns half the density allocation,
// rather than perfect marks. No city-specific training/calibration is claimed.
export const densityValue=(perKm:number,halfPoint=8)=>nonnegative(perKm)?perKm/(perKm+halfPoint):0;
// Fixed allocations are never expanded to fill absent evidence. The number
// measures supported route activity, not a probability of personal safety.
export function componentValues(a:ActivityAnalysis,road:RoadEvidence={}):Partial<Record<Component,number>>{
  if(!nonnegative(a.distanceMeters)||a.distanceMeters===0)return {};
  const km=Math.max(.5,a.distanceMeters/1000);
  const scan=nonnegative(a.scanCoverage)?clamp(a.scanCoverage):0;
  if(a.places?.length&&a.openPlaces!==null){
    const open=[...new Map(a.places.filter(p=>!p.conflict&&p.hours.state==='open'&&!p.hours.closingSoon).map(p=>[p.id,p])).values()];
    a={...a,openPlaces:open.length,potentialHelpPoints:a.potentialHelpPoints==null?a.potentialHelpPoints:open.filter(p=>p.categories.some(c=>HELP_CATEGORIES.has(c))).length,
      staffedPlaceProxy:a.staffedPlaceProxy==null?a.staffedPlaceProxy:open.filter(p=>p.categories.some(c=>STAFFED_PROXY_CATEGORIES.has(c))).length,
      openTransportPoints:a.openTransportPoints==null?a.openTransportPoints:open.filter(p=>p.categories.some(c=>['transit_station','bus_station','train_station','subway_station','light_rail_station'].includes(c))).length};
  }
  const values:Partial<Record<Component,number>>={};
  if(nonnegative(a.openPlaces))values.openDensity=densityValue(a.openPlaces/km)*scan;
  if(nonnegative(a.potentialHelpPoints)&&nonnegative(a.staffedPlaceProxy)&&nonnegative(a.longestObservedHelpGapMeters))values.helpDensity=(.75*densityValue(a.potentialHelpPoints/km,1)+.25*densityValue(a.staffedPlaceProxy/km))*(1-.5*clamp(a.longestObservedHelpGapMeters/2000))*scan;
  if(nonnegative(a.openPlaces)&&nonnegative(a.longestObservedLowActivityMeters)&&nonnegative(a.activityCoverage))values.gapContinuity=a.openPlaces>0?(1-clamp(a.longestObservedLowActivityMeters/1500))*clamp(a.activityCoverage)*scan:0;
  const roadTotal=(road.mainMeters??0)+(road.internalMeters??0)+(road.unknownMeters??0);
  if(Number.isFinite(road.mainRoadFraction)&&road.mainRoadFraction!>=0&&road.mainRoadFraction!<=1)values.mainRoad=road.mainRoadFraction;
  // Matched main-road metres provide a lower bound even in a partial scan.
  // Zero needs near-complete classification: unmatched length alone must not
  // manufacture a 0% main-road observation. The UI describes this lower bound.
  else if(roadTotal>0&&nonnegative(road.mainMeters)&&nonnegative(road.internalMeters)&&nonnegative(road.unknownMeters)&&(road.mainMeters>0||road.unknownMeters/roadTotal<=.05))values.mainRoad=clamp(road.mainMeters/roadTotal);
  if(Number.isFinite(road.maneuversPerKm)&&road.maneuversPerKm!>=0){
    const internal=Number.isFinite(road.internalTurnsPerKm)&&road.internalTurnsPerKm!>=0?road.internalTurnsPerKm!:0;
    // An estimated turn onto an internal road carries one additional turn penalty.
    values.simplicity=1-clamp((road.maneuversPerKm!+internal)/10);
  }
  if(nonnegative(a.openTransportPoints))values.transport=densityValue(a.openTransportPoints/km,1)*scan;
  return values;
}
/** A separate planning estimate; the underlying observations remain unchanged. */
function estimatedValues(a:ActivityAnalysis,road:RoadEvidence):Partial<Record<Component,number>>{
  const values=componentValues(a,road);
  delete values.openDensity;delete values.gapContinuity;
  const places=[...new Map(a.places.filter(p=>!p.conflict&&p.coordinate).map(p=>[p.id,p])).values()];
  const credit:number[]=places.map(p=>p.hours.closingSoon?0:p.hours.state==='open'?1:p.hours.state==='closed'?0:assumedShopHours(p,a.checkedAt)?.open===true?ESTIMATED_OPEN_CREDIT:0);
  if(a.distanceMeters>0&&places.length){
    // Discount each assumed opening once, before the density curve. Applying
    // the discount after saturation put an artificial ceiling on busy roads.
    const supportedCount=credit.reduce((sum,n)=>sum+n,0);
    values.openDensity=densityValue(supportedCount/Math.max(.5,a.distanceMeters/1000))*clamp(a.scanCoverage);
  }
  // Positive support along the actual sampled intervals. A hundred listings
  // at one checkpoint cannot represent activity across the whole journey.
  if(a.segments?.length&&places.every(p=>Array.isArray(p.sampleIndexes))){
    let supported=0,total=0,longest=0,gap=0;
    for(const [i,segment] of a.segments.entries()){
      const meters=Math.max(0,segment.toMeters-segment.fromMeters);
      const nearby=credit.filter((c,k)=>c>0&&(places[k].sampleIndexes.includes(i)||places[k].sampleIndexes.includes(i+1)));
      // Two weighted listings support an interval. Several estimated listings
      // can provide support, without asserting any specific business is open.
      const share=clamp(nearby.reduce((sum,c)=>sum+c,0)/2);
      supported+=meters*share;total+=meters;
      gap=share<.5?gap+meters:0;longest=Math.max(longest,gap);
    }
    if(total>0)values.gapContinuity=(supported/total)*(1-.5*clamp(longest/1500))*clamp(a.scanCoverage);
  }
  return values;
}
export function compareActivity(routes:Route[],analyses:ActivityAnalysis[],roads:Record<string,RoadEvidence>={}, options: { allowLive?: boolean; allowEstimates?: boolean; maxExtraMinutes?: number; mode?:LiveJourney['mode']; cameraEvidence?:Record<string,CameraEvidence> } = {}):Comparison{
  const weights=scoreWeights(options.mode);
  const fastest=[...routes].sort((a,b)=>a.durationSeconds-b.durationSeconds||a.id.localeCompare(b.id))[0];
  const base:Comparison={version:SCORE_VERSION,weights,fastestId:fastest?.id??null,selectedId:fastest?.id??null,recommendedId:null,outcome:routes.length?'single':'empty',message:routes.length?'Only one route was returned. There is no alternative to compare.':'No route options were returned.',commonComponents:[],scores:{},componentScores:{},rankedIds:[]};
  if(!routes.length)return base;
  const sparse=routes.every(r=>r.source==='geoapify')&&routes.some(r=>{const a=analyses.find(a=>a.routeId===r.id);return !a||!(a.hoursCoverage>=.5)||!(a.scanCoverage>=.8);});
  const estimated=sparse&&options.allowEstimates===true&&options.allowLive===true&&routes.every(r=>{const a=analyses.find(a=>a.routeId===r.id);return !!a&&a.scanCoverage>=.8&&Array.isArray(a.places)&&a.places.length>0;});
  if(sparse&&!estimated)return {...base,outcome:'insufficient',message:'The fastest route is selected. Too many opening hours or road sections are unknown to compare night activity reliably.'};
  if(routes.every(r=>r.source!=='sample')&&options.allowLive!==true)return routes.length<2?base:{...base,outcome:'insufficient',message:'Live scoring is switched off by the service setting.'};
  const byId=new Map(analyses.map(a=>[a.routeId,a]));
  if(new Set(routes.map(r=>byId.get(r.id)?.checkedAt)).size!==1)return {...base,outcome:'insufficient',message:'These routes do not share one evidence check. Refresh the comparison.'};
  const useInternal=routes.every(r=>Number.isFinite(roads[r.id]?.internalTurnsPerKm)&&roads[r.id].internalTurnsPerKm!>=0);
  const values=routes.map(r=>{
    const a=byId.get(r.id);
    const value:Partial<Record<Component,number>>=a?(estimated?estimatedValues:componentValues)(a,{...roads[r.id],internalTurnsPerKm:useInternal&&options.mode!=='WALK'?roads[r.id]?.internalTurnsPerKm:undefined}):{};
    const camera=options.cameraEvidence?.[r.id];
    if(a&&camera&&nonnegative(camera.value)&&camera.value<=1)value.cameras=camera.value;
    return value;
  });
  const common=(Object.keys(weights) as Component[]).filter(key=>weights[key]>0&&values.every(v=>v[key]!==undefined&&Number.isFinite(v[key])));
  if(!common.length)return routes.length<2?base:{...base,outcome:'insufficient',message:'Not enough shared evidence to score these routes yet. Travel times remain comparable.'};
  const scores=Object.fromEntries(routes.map((route,i)=>[route.id,common.reduce((sum,key)=>sum+weights[key]*clamp(values[i][key]!),0)]));
  const ranked=[...routes].sort((a,b)=>scores[b.id]-scores[a.id]||a.durationSeconds-b.durationSeconds||a.id.localeCompare(b.id));
  const maxExtra = options.maxExtraMinutes === undefined ? 10 : Math.max(0, Math.min(30, options.maxExtraMinutes));
  const best=ranked.find(r=>r.durationSeconds-fastest.durationSeconds<=maxExtra*60) ?? fastest;
  const componentScores=Object.fromEntries(routes.map((r,i)=>[r.id,values[i]]));
  const scored={...base,commonComponents:common,scores,componentScores,cameraEvidence:options.cameraEvidence,rankedIds:ranked.map(r=>r.id)};
  if(estimated)return {...scored,estimated:true,outcome:'insufficient',message:'The fastest route is selected. Estimated scores combine available road information with listed hours and typical shop schedules. They do not confirm which route is safer.'};
  if(routes.length<2)return scored;
  if(!common.includes('openDensity'))return {...scored,outcome:'insufficient',recommendedId:null,message:'The fastest route is selected. We could compare road information, but there is not enough shop-opening data to say which route has more activity.'};
  if(common.reduce((sum,key)=>sum+weights[key],0)<60)return {...scored,outcome:'insufficient',message:'The fastest route is selected. Review the activity details alongside travel time before choosing.'};
  const advantage=scores[best.id]-scores[fastest.id];
  const allRange=Math.max(...Object.values(scores))-Math.min(...Object.values(scores));
  if(allRange<10)return {...scored,outcome:'similar',message:'These routes have similar listed activity. The fastest option is selected.'};
  if(best.id===fastest.id && ranked[0].id!==fastest.id)return {...scored,outcome:'detour',message:`The stronger activity options exceed your ${maxExtra}-minute extra-time preference. The fastest option is selected.`};
  if(best.id===fastest.id)return {...scored,outcome:'more-activity',recommendedId:fastest.id,message:`The fastest option also has the strongest comparable listing activity evidence.`};
  if(advantage<10)return {...scored,outcome:'similar',message:'The fastest option has similar activity to the strongest candidate. It is selected.'};
  const extra=best.durationSeconds-fastest.durationSeconds;
  if(options.maxExtraMinutes===undefined&&(extra>600||extra>fastest.durationSeconds*.35))return {...scored,outcome:'detour',message:'More listed activity comes with a substantial detour. The fastest option is selected so you can weigh the tradeoff.'};
  const descriptions:Record<Component,string>={openDensity:'more places listed as open per kilometre',mainRoad:'a higher main-road share',helpDensity:'stronger open help and staffed-place category evidence',gapContinuity:'a shorter observed low-activity stretch',simplicity:'a lower turn burden after accounting for available road evidence',transport:'more transport locations listed as open per kilometre',cameras:'more mapped camera evidence along the route'};
  const gain=(key:Component)=>weights[key]*(componentScores[best.id][key]!-componentScores[fastest.id][key]!);
  const facts=common.filter(key=>gain(key)>0).sort((a,b)=>gain(b)-gain(a)).slice(0,3).map(key=>descriptions[key]);
  if(!facts.length)facts.push('stronger comparable listing evidence');
  const explanation=facts.length>1?`${facts.slice(0,-1).join(', ')} and ${facts.at(-1)}`:facts[0];
  return {...scored,outcome:'more-activity',selectedId:best.id,recommendedId:best.id,message:`For ${Math.ceil(extra/60)} extra minutes, this route has ${explanation}.`};
}
