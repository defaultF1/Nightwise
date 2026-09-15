import {expect,test,vi,afterEach} from 'vitest';
import {geoArea,geoCategories,geoMode,geoPlace,geoRoutes,Geoapify} from '../../server/geoapify';
import {DEFAULT_JOURNEY,AEOS_PIN} from '../../src/domain/journey';
import {assumedShopHours} from '../../src/domain/assumed-hours';
import {evaluateObservation} from '../../src/domain/hours';
import {compareActivity} from '../../src/domain/comparison';
import {mapsHandoff} from '../../src/domain/handoff';
import type {ActivityAnalysis} from '../../src/domain/activity-types';

process.env.TZ='Asia/Kolkata';
const at='2026-09-15T12:00:00+05:30';
const feature=(hours?:string,category='commercial.supermarket')=>({properties:{lat:AEOS_PIN.latitude,lon:AEOS_PIN.longitude,place_id:'abc123',name:'Test listing',categories:[category],...(hours?{opening_hours:hours}:{})}});
const routeData={features:[{properties:{time:600,distance:4500,legs:[]},geometry:{type:'LineString',coordinates:[[77.594089,13.062827],[77.61,13.06],[77.619939,13.047697]]}}]};
afterEach(()=>vi.restoreAllMocks());

test('local service area accepts AEOS/Manyata and rejects Kanpur and invalid points',()=>{
 expect(geoArea(DEFAULT_JOURNEY.origin)).toBe(true);expect(geoArea(DEFAULT_JOURNEY.destination)).toBe(true);
 expect(geoArea({latitude:26.5,longitude:80.3})).toBe(false);expect(geoArea({latitude:NaN,longitude:77})).toBe(false);
 expect(['DRIVE','TWO_WHEELER','WALK'].map(m=>geoMode(m as any))).toEqual(['drive','motorcycle','walk']);
});
test('keeps hospital, pharmacy and fuel categories distinct and excludes private listings',()=>{
 expect(geoCategories({categories:['healthcare.hospital']})).toEqual(['hospital']);
 expect(geoCategories({categories:['healthcare.pharmacy']})).toEqual(['pharmacy']);
 expect(geoCategories({datasource:{raw:{amenity:'fuel'}}})).toEqual(['gas_station']);
 const f=feature();expect(geoPlace({...f,properties:{...f.properties,datasource:{raw:{access:'private'}}}},at)).toBeNull();
});
test('evaluates regular Indian hours at passing time, including closing and overnight',()=>{
 const p=geoPlace(feature('Mo-Su 09:00-20:00'),at)!;
 expect(evaluateObservation(p,at)).toMatchObject({state:'open',basis:'regular'});
 expect(evaluateObservation(p,'2026-09-15T19:50:00+05:30',15,at).state).toBe('closed');
 const night=geoPlace(feature('Mo-Su 22:00-02:00'),at)!;
 expect(evaluateObservation(night,'2026-09-16T01:00:00+05:30',0,at).state).toBe('open');
 expect(evaluateObservation(night,'2026-09-16T02:00:00+05:30',0,at).state).toBe('closed');
 expect(evaluateObservation(geoPlace(feature('24/7'),at)!,at)).toMatchObject({state:'open',open24Hours:true,basis:'regular'});
});
test('missing or ambiguous schedules do not become confirmed hours; stale evidence expires',()=>{
 for(const hours of [undefined,'Mo-Su 09:00-20:00; PH off','by appointment','unparseable hours']){
  const p=geoPlace(feature(hours),at)!;const evaluation=evaluateObservation(p,at);
  expect(evaluation.state).toBe('unknown');
  if(hours)expect(assumedShopHours({...p,hours:evaluation,sampleIndexes:[],conflict:false},at)).toBeNull();
 }
 expect(evaluateObservation(geoPlace(feature('24/7'),at)!,'2026-09-15T13:00:00+05:30').state).toBe('unknown');
});
test('normalizes real road geometry, rejects invalid geometry and preserves handoff modes',()=>{
 const route=geoRoutes(routeData,'Fastest')[0];
 expect(route.source).toBe('geoapify');expect(route.path[0]).toEqual({latitude:13.062827,longitude:77.594089});
 expect(geoRoutes({...routeData,features:[{...routeData.features[0],properties:{time:-1,distance:4500}}]},'x')).toEqual([]);
 expect(new URL(mapsHandoff(DEFAULT_JOURNEY,route,route.id)).searchParams.has('waypoints')).toBe(false);
 expect(new URL(mapsHandoff({...DEFAULT_JOURNEY,mode:'WALK'},route,'other')).searchParams.get('travelmode')).toBe('walking');
 expect(new URL(mapsHandoff(DEFAULT_JOURNEY,route,'other')).searchParams.has('waypoints')).toBe(true);
});
test('sparse or missing Geoapify schedules cannot produce a numeric activity recommendation',()=>{
 const route=geoRoutes(routeData,'Fastest')[0];
 for(const analyses of [[],[{routeId:route.id,hoursCoverage:.07,scanCoverage:1}] as ActivityAnalysis[],[{routeId:route.id,hoursCoverage:1,scanCoverage:.4}] as ActivityAnalysis[]]){
  expect(compareActivity([route],analyses,{}, {allowLive:true})).toMatchObject({outcome:'insufficient',selectedId:route.id,recommendedId:null,scores:{}});
 }
});
test('identical returned paths are deduplicated while distinct preferences remain',async()=>{
 const provider=new Geoapify('test-only-unused');
 const changed=structuredClone(routeData);changed.features[0].geometry.coordinates[1]=[77.605,13.05];
 vi.spyOn(provider,'request').mockResolvedValueOnce(routeData).mockResolvedValueOnce(changed).mockResolvedValueOnce(routeData);
 const routes=await provider.routes(DEFAULT_JOURNEY,new AbortController().signal);
 expect(routes).toHaveLength(2);expect(new Set(routes.map(r=>r.id)).size).toBe(2);
});
test('a bounded avoid-highways fallback adds a substantially different third road option',async()=>{
 const provider=new Geoapify('test-only-unused');
 const other=structuredClone(routeData);other.features[0].geometry.coordinates[1]=[77.605,13.04];
 const fallback=structuredClone(routeData);fallback.features[0].geometry.coordinates[1]=[77.605,13.072];
 const request=vi.spyOn(provider,'request').mockResolvedValueOnce(routeData).mockResolvedValueOnce(other).mockResolvedValueOnce(routeData).mockResolvedValueOnce(fallback);
 const routes=await provider.routes(DEFAULT_JOURNEY,new AbortController().signal);
 expect(routes).toHaveLength(3);expect(request).toHaveBeenCalledTimes(4);
 expect(request.mock.calls[3][1].avoid).toBe('highways');
});
