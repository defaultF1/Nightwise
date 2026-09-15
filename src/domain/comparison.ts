import type { Route } from './types';
import type { ActivityAnalysis, Comparison, Component, RoadEvidence } from './activity-types';
import { summarizeCameras } from './cameras';

export const SCORE_VERSION='safety-v1-camera-evidence';
export const WEIGHTS:Record<Component,number>={openDensity:21.25,mainRoad:17,helpDensity:12.75,gapContinuity:12.75,simplicity:12.75,transport:8.5,cameraCoverage:15};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
// Components are built from what was actually observed. A signal missing for
// any route is left out and the remaining weights rescale to 100; missing
// evidence is never scored as zero.
export function componentValues(a:ActivityAnalysis,road:RoadEvidence={}):Partial<Record<Component,number>>{
  if(a.distanceMeters<=0)return {};
  const km=a.distanceMeters/1000;
  const values:Partial<Record<Component,number>>={};
  if(a.openPlaces!==null)values.openDensity=clamp(a.openPlaces/km/8);
  if(a.potentialHelpPoints!==null&&a.staffedPlaceProxy!==null)values.helpDensity=(.75*clamp(a.potentialHelpPoints/km/2)+.25*clamp(a.staffedPlaceProxy/km/8))*(1-.5*clamp(a.longestObservedHelpGapMeters/2000));
  if(a.openPlaces!==null)values.gapContinuity=1-clamp(a.longestObservedLowActivityMeters/1500);
  const roadTotal=(road.mainMeters??0)+(road.internalMeters??0)+(road.unknownMeters??0);
  if(Number.isFinite(road.mainRoadFraction)&&road.mainRoadFraction!>=0&&road.mainRoadFraction!<=1)values.mainRoad=road.mainRoadFraction;
  else if(roadTotal>0)values.mainRoad=clamp((road.mainMeters??0)/roadTotal);
  if(Number.isFinite(road.maneuversPerKm)&&road.maneuversPerKm!>=0){
    const internal=Number.isFinite(road.internalTurnsPerKm)&&road.internalTurnsPerKm!>=0?road.internalTurnsPerKm!:0;
    // An estimated turn onto an internal road carries one additional turn penalty.
    values.simplicity=1-clamp((road.maneuversPerKm!+internal)/10);
  }
  if(a.openTransportPoints!=null&&Number.isFinite(a.openTransportPoints)&&a.openTransportPoints>=0)values.transport=clamp(a.openTransportPoints/km/3);
  return values;
}
export function compareActivity(routes:Route[],analyses:ActivityAnalysis[],roads:Record<string,RoadEvidence>={}, options: { allowLive?: boolean; maxExtraMinutes?: number; now?: number } = {}):Comparison{
  const fastest=[...routes].sort((a,b)=>a.durationSeconds-b.durationSeconds||a.id.localeCompare(b.id))[0];
  const base:Comparison={version:SCORE_VERSION,fastestId:fastest?.id??null,selectedId:fastest?.id??null,recommendedId:null,outcome:routes.length?'single':'empty',message:routes.length?'Only one route was returned. There is no alternative to compare.':'No route options were returned.',commonComponents:[],scores:{},componentScores:{},rankedIds:[]};
  if(!routes.length)return base;
  if(routes.some(r=>r.source!=='sample')&&options.allowLive!==true)return routes.length<2?base:{...base,outcome:'insufficient',message:'Live scoring is switched off by the service setting.'};
  const byId=new Map(analyses.map(a=>[a.routeId,a]));
  if(new Set(routes.map(r=>byId.get(r.id)?.checkedAt)).size!==1)return {...base,outcome:'insufficient',message:'These routes do not share one evidence check. Refresh the comparison.'};
  const useInternal=routes.every(r=>Number.isFinite(roads[r.id]?.internalTurnsPerKm)&&roads[r.id].internalTurnsPerKm!>=0);
  const now = options.now ?? Date.now();
  const values=routes.map(r=>{
    const a=byId.get(r.id);
    if (!a) return {};
    const values = componentValues(a,{...roads[r.id],internalTurnsPerKm:useInternal?roads[r.id]?.internalTurnsPerKm:undefined});
    const cameras = summarizeCameras(r, a.cameras, now);
    if (cameras) values.cameraCoverage = cameras.value;
    return values;
  });
  const common=(Object.keys(WEIGHTS) as Component[]).filter(key=>values.every(v=>v[key]!==undefined&&Number.isFinite(v[key])));
  if(!common.length)return routes.length<2?base:{...base,outcome:'insufficient',message:'Not enough shared evidence to score these routes yet. Travel times remain comparable.'};
  const denominator=common.reduce((sum,key)=>sum+WEIGHTS[key],0);
  const scores=Object.fromEntries(routes.map((route,i)=>[route.id,100*common.reduce((sum,key)=>sum+WEIGHTS[key]*values[i][key]!,0)/denominator]));
  const ranked=[...routes].sort((a,b)=>scores[b.id]-scores[a.id]||a.durationSeconds-b.durationSeconds||a.id.localeCompare(b.id));
  const maxExtra = options.maxExtraMinutes === undefined ? 10 : Math.max(0, Math.min(30, options.maxExtraMinutes));
  const best=ranked.find(r=>r.durationSeconds-fastest.durationSeconds<=maxExtra*60) ?? fastest;
  const componentScores=Object.fromEntries(routes.map((r,i)=>[r.id,values[i]]));
  const scored={...base,commonComponents:common,scores,componentScores,rankedIds:ranked.map(r=>r.id)};
  if(routes.length<2)return scored;
  if(!common.includes('openDensity'))return {...scored,outcome:'insufficient',recommendedId:null,message:'The fastest route is selected. We could compare road information, but there is not enough shop-opening data to say which route has more activity.'};
  const advantage=scores[best.id]-scores[fastest.id];
  const allRange=Math.max(...Object.values(scores))-Math.min(...Object.values(scores));
  if(allRange<10)return {...scored,outcome:'similar',message:'These routes have similar Safety Scores. The fastest option is selected.'};
  if(best.id===fastest.id && ranked[0].id!==fastest.id)return {...scored,outcome:'detour',message:`The higher-scoring options exceed your ${maxExtra}-minute extra-time preference. The fastest option is selected.`};
  if(best.id===fastest.id)return {...scored,outcome:'more-activity',recommendedId:fastest.id,message:`The fastest option also has the highest comparable Safety Score.`};
  if(advantage<10)return {...scored,outcome:'similar',message:'The fastest option has a similar Safety Score to the strongest candidate. It is selected.'};
  const extra=best.durationSeconds-fastest.durationSeconds;
  if(options.maxExtraMinutes===undefined&&(extra>600||extra>fastest.durationSeconds*.35))return {...scored,outcome:'detour',message:'A higher Safety Score comes with a substantial detour. The fastest option is selected so you can weigh the tradeoff.'};
  const descriptions:Record<Component,string>={openDensity:'more places listed as open per kilometre',mainRoad:'a higher main-road share',helpDensity:'stronger open help and staffed-place category evidence',gapContinuity:'a shorter observed low-activity stretch',simplicity:'a lower turn burden after accounting for available road evidence',transport:'more transport locations listed as open per kilometre',cameraCoverage:'more mapped camera locations per kilometre and a wider spread along the route'};
  const gain=(key:Component)=>WEIGHTS[key]*(componentScores[best.id][key]!-componentScores[fastest.id][key]!);
  const facts=common.filter(key=>gain(key)>0).sort((a,b)=>gain(b)-gain(a)).slice(0,3).map(key=>descriptions[key]);
  if(!facts.length)facts.push('stronger comparable listing evidence');
  const explanation=facts.length>1?`${facts.slice(0,-1).join(', ')} and ${facts.at(-1)}`:facts[0];
  return {...scored,outcome:'more-activity',selectedId:best.id,recommendedId:best.id,message:`For ${Math.ceil(extra/60)} extra minutes, this route has ${explanation}.`};
}
