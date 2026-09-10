import type { Route } from './types';
import type { ActivityAnalysis, Comparison, Component, RoadEvidence } from './activity-types';
import { compareLive } from './live-scoring';

export const SCORE_VERSION='sample-activity-v3';
export const WEIGHTS:Record<Component,number>={openDensity:25,mainRoad:20,helpDensity:15,gapContinuity:15,simplicity:15,transport:10};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export function componentValues(a:ActivityAnalysis,road:RoadEvidence={}):Partial<Record<Component,number>>{
  if(!a.coreComparable||a.distanceMeters<=0)return {};
  const km=a.distanceMeters/1000;
  const values:Partial<Record<Component,number>>={};
  if(a.openPlaces!==null)values.openDensity=clamp(a.openPlaces/km/8);
  if(a.potentialHelpPoints!==null&&a.staffedPlaceProxy!==null&&a.longestHelpGapMeters!==null)values.helpDensity=(.75*clamp(a.potentialHelpPoints/km/2)+.25*clamp(a.staffedPlaceProxy/km/8))*(1-.5*clamp(a.longestHelpGapMeters/2000));
  if(a.longestLowActivityMeters!==null)values.gapContinuity=1-clamp(a.longestLowActivityMeters/1500);
  if(Number.isFinite(road.mainRoadFraction)&&road.mainRoadFraction!>=0&&road.mainRoadFraction!<=1)values.mainRoad=road.mainRoadFraction;
  if(Number.isFinite(road.maneuversPerKm)&&road.maneuversPerKm!>=0){
    const internal=Number.isFinite(road.internalTurnsPerKm)&&road.internalTurnsPerKm!>=0?road.internalTurnsPerKm!:0;
    // An estimated turn onto an internal road carries one additional turn penalty.
    values.simplicity=1-clamp((road.maneuversPerKm!+internal)/10);
  }
  if(a.openTransportPoints!=null&&Number.isFinite(a.openTransportPoints)&&a.openTransportPoints>=0)values.transport=clamp(a.openTransportPoints/km/3);
  return values;
}
export function compareActivity(routes:Route[],analyses:ActivityAnalysis[],roads:Record<string,RoadEvidence>={}, options: { allowLive?: boolean; maxExtraMinutes?: number } = {}):Comparison{
  const fastest=[...routes].sort((a,b)=>a.durationSeconds-b.durationSeconds||a.id.localeCompare(b.id))[0];
  const base:Comparison={version:SCORE_VERSION,fastestId:fastest?.id??null,selectedId:fastest?.id??null,recommendedId:null,outcome:routes.length?'single':'empty',message:routes.length?'Only one route was returned. There is no alternative to compare.':'No route options were returned.',commonComponents:[],scores:{},componentScores:{},rankedIds:[]};
  if(routes.length&&routes.every(r=>r.source==='google')&&options.allowLive===true)return compareLive(routes,analyses,roads,base,options.maxExtraMinutes);
  if(routes.length<2)return base;
  const byId=new Map(analyses.map(a=>[a.routeId,a]));
  const sameCheckTime=new Set(routes.map(r=>byId.get(r.id)?.checkedAt)).size===1;
  const usable=sameCheckTime&&routes.every(r=>{const a=byId.get(r.id);return a?.coreComparable&&(a.source==='sample'||options.allowLive===true)&&(a.closingSoon??0)===0;});
  if(!usable)return {...base,outcome:'insufficient',message:'Not enough information to recommend a route. Unknown areas and uncertain opening hours are kept separate.'};
  const useInternal=routes.every(r=>Number.isFinite(roads[r.id]?.internalTurnsPerKm)&&roads[r.id].internalTurnsPerKm!>=0);
  const values=routes.map(r=>componentValues(byId.get(r.id)!,{...roads[r.id],internalTurnsPerKm:useInternal?roads[r.id].internalTurnsPerKm:undefined}));
  const common=(Object.keys(WEIGHTS) as Component[]).filter(key=>values.every(v=>v[key]!==undefined&&Number.isFinite(v[key])));
  const required:Component[]=['openDensity','helpDensity','gapContinuity'];
  if(!required.every(c=>common.includes(c)))return {...base,outcome:'insufficient',message:'The available evidence is not comparable across these routes.'};
  const denominator=common.reduce((sum,key)=>sum+WEIGHTS[key],0);
  const scores=Object.fromEntries(routes.map((route,i)=>[route.id,100*common.reduce((sum,key)=>sum+WEIGHTS[key]*values[i][key]!,0)/denominator]));
  const ranked=[...routes].sort((a,b)=>scores[b.id]-scores[a.id]||a.durationSeconds-b.durationSeconds||a.id.localeCompare(b.id));
  const maxExtra = options.maxExtraMinutes === undefined ? 10 : Math.max(0, Math.min(30, options.maxExtraMinutes));
  const best=ranked.find(r=>r.durationSeconds-fastest.durationSeconds<=maxExtra*60) ?? fastest;
  const isLive=routes.every(r=>r.source==='google');
  const componentScores=Object.fromEntries(routes.map((r,i)=>[r.id,values[i]]));
  const scored={...base,version:isLive?'experimental-live-activity-v3':SCORE_VERSION,commonComponents:common,scores,componentScores,rankedIds:ranked.map(r=>r.id)};
  const advantage=scores[best.id]-scores[fastest.id];
  const allRange=Math.max(...Object.values(scores))-Math.min(...Object.values(scores));
  if(allRange<10)return {...scored,outcome:'similar',message:'These routes have similar listed activity. The fastest option is selected.'};
  if(best.id===fastest.id && ranked[0].id!==fastest.id)return {...scored,outcome:'detour',message:`The stronger activity options exceed your ${maxExtra}-minute extra-time preference. The fastest option is selected.`};
  if(best.id===fastest.id)return {...scored,outcome:'more-activity',recommendedId:fastest.id,message:`The fastest option also has the strongest comparable ${isLive?'listing':'sample'} activity evidence.`};
  if(advantage<10)return {...scored,outcome:'similar',message:'The fastest option has similar activity to the strongest candidate. It is selected.'};
  const extra=best.durationSeconds-fastest.durationSeconds;
  if(options.maxExtraMinutes===undefined&&(extra>600||extra>fastest.durationSeconds*.35))return {...scored,outcome:'detour',message:'More listed activity comes with a substantial detour. The fastest option is selected so you can weigh the tradeoff.'};
  const descriptions:Record<Component,string>={openDensity:'more places listed as open per kilometre',mainRoad:'a higher main-road share',helpDensity:'stronger open help and staffed-place category evidence',gapContinuity:'a shorter observed low-activity stretch',simplicity:'a lower turn burden after accounting for available road evidence',transport:'more transport locations listed as open per kilometre'};
  const gain=(key:Component)=>WEIGHTS[key]*(componentScores[best.id][key]!-componentScores[fastest.id][key]!);
  const facts=common.filter(key=>gain(key)>0).sort((a,b)=>gain(b)-gain(a)).slice(0,3).map(key=>descriptions[key]);
  if(!facts.length)facts.push('stronger comparable listing evidence');
  const explanation=facts.length>1?`${facts.slice(0,-1).join(', ')} and ${facts.at(-1)}`:facts[0];
  return {...scored,outcome:'more-activity',selectedId:best.id,recommendedId:best.id,message:`For ${Math.ceil(extra/60)} extra minutes, this ${isLive?'route':'sample'} has ${explanation}.`};
}
