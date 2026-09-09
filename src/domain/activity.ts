import type { Route } from './types';
import type { ActivityAnalysis, ActivitySegment, NearbyScan, PlaceObservation, QueryPlan, DeduplicatedPlace } from './activity-types';
import { distanceMeters, samplePolyline, validCoordinate } from './geometry';
import { evaluateObservation, isFresh } from './hours';

export const HELP_CATEGORIES = new Set(['hospital','police','pharmacy','hotel','gas_station']);
export const STAFFED_PROXY_CATEGORIES = new Set([...HELP_CATEGORIES,'restaurant','cafe','store','convenience_store','supermarket']);
// Provisional, disclosed threshold. Field testing must calibrate this value.
export const MIN_OPEN_FOR_ACTIVITY = 2;
export function longestRun(segments:ActivitySegment[],state:ActivitySegment['state']='low') {
  let current=0,longest=0;
  for(const segment of segments){current=segment.state===state?current+segment.toMeters-segment.fromMeters:0;longest=Math.max(longest,current);}
  return longest;
}

export function buildQueryPlan(routes:Route[],spacing=200,maxQueries=120):QueryPlan{
  const queries=new Map<string,QueryPlan['queries'][number]>();const samplesByRoute:QueryPlan['samplesByRoute']={};let totalSamples=0;
  for(const route of routes){
    if(samplesByRoute[route.id])throw new Error('Duplicate route ID');
    samplesByRoute[route.id]=samplePolyline(route.path,spacing,maxQueries).map(sample=>{
      // Exact coordinate identity only; no shared-corridor inference from road names.
      const id=`q:${sample.coordinate.latitude}:${sample.coordinate.longitude}`;
      if(!queries.has(id))queries.set(id,{id,coordinate:sample.coordinate,radiusMeters:150});
      return {...sample,queryId:id};
    });totalSamples+=samplesByRoute[route.id].length;
  }
  if(queries.size>maxQueries)throw new Error('Comparison exceeds the analysis query budget');
  return {queries:[...queries.values()],samplesByRoute,totalSamples};
}

export function analyzeRoute(route:Route,plan:QueryPlan,scans:NearbyScan[],checkedAt:string):ActivityAnalysis{
  const samples=plan.samplesByRoute[route.id];
  if(!samples?.length||!Number.isFinite(Date.parse(checkedAt)))throw new Error('Missing analysis inputs');
  const queries=new Map(plan.queries.map(q=>[q.id,q]));
  const scanMap=new Map<string,NearbyScan>();const duplicateScans=new Set<string>();
  for(const scan of scans){if(scanMap.has(scan.queryId))duplicateScans.add(scan.queryId);scanMap.set(scan.queryId,scan);}
  const limitations=new Set<string>();
  const groups=new Map<string,{observations:PlaceObservation[];sampleIndexes:Set<number>}>();
  const statuses=samples.map((sample,index)=>{
    const scan=scanMap.get(sample.queryId),query=queries.get(sample.queryId);
    const fresh=!!scan&&isFresh(scan.observedAt,checkedAt);
    const usable=!!scan&&!!query&&fresh&&scan.status==='ok'&&!duplicateScans.has(sample.queryId);
    if(!scan||scan.status==='failed')limitations.add('Some nearby searches were unavailable.');
    if(scan&&!fresh)limitations.add('Stale or invalid evidence was excluded.');
    if(scan?.status==='capped')limitations.add('A search reached its result limit; counts are partial.');
    if(duplicateScans.has(sample.queryId))limitations.add('Conflicting search records were excluded.');
    let invalidPlace=false;
    if(scan&&query&&fresh&&scan.status!=='failed'&&!duplicateScans.has(sample.queryId))for(const place of scan.places){
      if(!place.id||!validCoordinate(place.coordinate)||!isFresh(place.observedAt,checkedAt)){invalidPlace=true;limitations.add('Invalid or stale place details were excluded.');continue;}
      if(distanceMeters(query.coordinate,place.coordinate)>query.radiusMeters+1)continue;
      let group=groups.get(place.id);if(!group){group={observations:[],sampleIndexes:new Set()};groups.set(place.id,group);}
      group.observations.push(place);group.sampleIndexes.add(index);
    }
    return {usable:usable&&!invalidPlace,observed:!!scan&&fresh&&scan.status!=='failed'&&!duplicateScans.has(sample.queryId)&&!invalidPlace};
  });
  const places:DeduplicatedPlace[]=[];
  for(const [id,group] of groups){
    const evaluations=group.observations.map(p=>evaluateObservation(p,checkedAt,route.durationSeconds/60));
    const states=new Set(evaluations.map(e=>e.state));
    const coordinateConflict=group.observations.some(p=>distanceMeters(p.coordinate,group.observations[0].coordinate)>30);
    const conflict=states.size>1||coordinateConflict;
    if(conflict)limitations.add('Conflicting details for a place were treated as unknown.');
    const knownClosing=evaluations.map(e=>e.minutesUntilClose).filter((n):n is number=>n!==null);
    const hours=conflict?{state:'unknown' as const,closingSoon:false,minutesUntilClose:null}:{...evaluations[0],closingSoon:evaluations.some(e=>e.closingSoon),minutesUntilClose:knownClosing.length?Math.min(...knownClosing):null};
    // Keep only categories consistently reported for a duplicate listing.
    const categories=group.observations[0].categories.filter(c=>group.observations.every(p=>p.categories.includes(c)));
    places.push({id,hours,categories:[...new Set(categories)],sampleIndexes:[...group.sampleIndexes],conflict});
  }
  const sampleState=statuses.map((status,i):ActivitySegment['state']=>{
    if(!status.usable)return 'unknown';
    const nearby=places.filter(p=>p.sampleIndexes.includes(i));
    if(nearby.filter(p=>p.hours.state==='open').length>=MIN_OPEN_FOR_ACTIVITY)return 'active';
    if(nearby.some(p=>p.hours.state==='unknown'))return 'unknown';
    return 'low';
  });
  const segments:ActivitySegment[]=samples.slice(1).map((sample,i)=>({fromMeters:samples[i].distanceMeters,toMeters:sample.distanceMeters,state:sampleState[i]==='unknown'||sampleState[i+1]==='unknown'?'unknown':sampleState[i]==='active'||sampleState[i+1]==='active'?'active':'low'}));
  const helpStates=statuses.map((status,i):ActivitySegment['state']=>{
    if(!status.usable)return 'unknown';
    const nearby=places.filter(p=>p.sampleIndexes.includes(i)&&p.categories.some(c=>HELP_CATEGORIES.has(c)));
    if(nearby.some(p=>p.hours.state==='open'))return 'active';
    if(nearby.some(p=>p.hours.state==='unknown'))return 'unknown';
    return 'low';
  });
  const helpSegments:ActivitySegment[]=samples.slice(1).map((sample,i)=>({fromMeters:samples[i].distanceMeters,toMeters:sample.distanceMeters,state:helpStates[i]==='unknown'||helpStates[i+1]==='unknown'?'unknown':helpStates[i]==='active'||helpStates[i+1]==='active'?'active':'low'}));
  const helpGap=longestRun(helpSegments);
  const length=samples.at(-1)!.distanceMeters;
  let scanned=0,assessed=0,longest=0,current=0;
  segments.forEach((segment,i)=>{const meters=segment.toMeters-segment.fromMeters;if(statuses[i].usable&&statuses[i+1].usable)scanned+=meters;if(segment.state!=='unknown')assessed+=meters;if(segment.state==='low'){current+=meters;longest=Math.max(longest,current);}else current=0;});
  const open=places.filter(p=>p.hours.state==='open');const closed=places.filter(p=>p.hours.state==='closed');
  const totalLow=segments.filter(s=>s.state==='low').reduce((sum,s)=>sum+s.toMeters-s.fromMeters,0);
  const unknown=places.length-open.length-closed.length;
  if(unknown)limitations.add('Some opening hours are unknown.');
  const scanCoverage=length>0?scanned/length:0,activityCoverage=length>0?assessed/length:0;
  const hoursCoverage=places.length?(places.length-unknown)/places.length:(scanCoverage===1?1:0);
  const anyObserved=statuses.some(s=>s.observed);
  // Strict initial gate: every section and every listing must be assessable.
  const coreComparable=scanCoverage>=1-1e-9&&activityCoverage>=1-1e-9&&hoursCoverage>=1-1e-9;
  if(open.some(p=>p.hours.closingSoon))limitations.add('Some listed places may close before arrival; availability is not guaranteed.');
  return {routeId:route.id,source:route.source==='sample'?'sample':'live',checkedAt,distanceMeters:length,
    openPlaces:anyObserved?open.length:null,closedPlaces:anyObserved?closed.length:null,unknownHours:anyObserved?unknown:null,
    potentialHelpPoints:anyObserved?open.filter(p=>p.categories.some(c=>HELP_CATEGORIES.has(c))).length:null,
    staffedPlaceProxy:anyObserved?open.filter(p=>p.categories.some(c=>STAFFED_PROXY_CATEGORIES.has(c))).length:null,
    longestHelpGapMeters:coreComparable?helpGap:null,longestObservedHelpGapMeters:helpGap,lowActivityOpenThreshold:MIN_OPEN_FOR_ACTIVITY,
    openTransportPoints:anyObserved?open.filter(p=>p.categories.some(c=>['transit_station','bus_station','train_station','subway_station','light_rail_station'].includes(c))).length:null,
    closingSoon:anyObserved?open.filter(p=>p.hours.closingSoon).length:null,
    scanCoverage,activityCoverage,hoursCoverage,longestLowActivityMeters:coreComparable?longest:null,longestObservedLowActivityMeters:longest,
    totalLowActivityMeters:coreComparable?totalLow:null,totalObservedLowActivityMeters:totalLow,
    segments,places,limitations:[...limitations],coreComparable};
}
