import { describe, expect, it } from 'vitest';
import { compareActivity } from '../../src/domain/comparison';
import { summarizeCameras, CAMERA_FRESHNESS_MS, type RouteCameraEvidence } from '../../src/domain/cameras';
import { parseMapplsCameraReports } from '../../src/providers/mappls-camera-reports';
import { analyzeComparison } from '../../src/domain/analyze-comparison';
import { fixtureScans, fixtureRoadEvidence, TUTORIAL_CHECKED_AT } from '../../src/data/activity-fixtures';
import { sampleRouteOptions } from '../../src/providers/routes';
import type { Route } from '../../src/domain/types';
import { cameraPins } from '../../src/maps/camera-pins';

const now = Date.parse('2026-09-16T12:00:00Z');
const point = (m:number, north=0) => ({latitude:north/111195.0802335329,longitude:m/111195.0802335329});
const route:Route = {id:'a',label:'Route A',durationSeconds:600,distanceMeters:2000,path:[point(0),point(2000)],source:'sample',geometryKind:'illustrative'};
const evidence = (positions:number[] = [250,1250]):RouteCameraEvidence => ({routeId:route.id,provider:'mappls',checkedAt:new Date(now).toISOString(),status:'complete',path:route.path,reports:positions.map((m,i)=>({id:String(i),coordinate:point(m),kind:'traffic-camera',alongRouteMeters:m}))});

describe('route camera evidence',()=>{
  it('counts only unique locations and distinguishes a completed empty query from no data',()=>{
    expect(summarizeCameras(route,evidence([250,250,260,1250]),now)?.count).toBe(2);
    expect(summarizeCameras(route,evidence([]),now)?.value).toBe(0);
    expect(summarizeCameras(route,undefined,now)).toBeUndefined();
  });
  it('rejects stale, future, partial, mismatched and malformed evidence',()=>{
    const e=evidence();
    for(const change of [{checkedAt:new Date(now-CAMERA_FRESHNESS_MS).toISOString()},{checkedAt:new Date(now+1).toISOString()},{status:'partial' as const},{status:'unavailable' as const},{routeId:'other'},{path:[point(0,100),point(2000,100)]},{reports:[{...e.reports[0],coordinate:point(250,100)}]},{reports:[{...e.reports[0],alongRouteMeters:1500}]},{reports:[{...e.reports[0],expiresAt:'bad'}]}]) expect(summarizeCameras(route,{...e,...change},now)).toBeUndefined();
  });
  it('drops expired reports and uses the same validated evidence for map pins',()=>{
    const e=evidence(); e.reports[0].expiresAt=new Date(now).toISOString();
    expect(summarizeCameras(route,e,now)?.count).toBe(1);
    expect(cameraPins(route,e,now)).toHaveLength(1);
    expect(cameraPins(route,e,now+CAMERA_FRESHNESS_MS)).toHaveLength(0);
  });
  it('rewards spread and normalizes density by route distance',()=>{
    expect(summarizeCameras(route,evidence(),now)!.value).toBeGreaterThan(summarizeCameras(route,evidence([250,500]),now)!.value);
    const long={...route,distanceMeters:4000,path:[point(0),point(4000)]};
    const e={...evidence([250,1250,2250,3250]),path:long.path};
    expect(summarizeCameras(long,e,now)!.value).toBeCloseTo(summarizeCameras(route,evidence(),now)!.value);
  });
  it('does not raise a score when one alternative lacks camera evidence',()=>{
    const routes=sampleRouteOptions('Manyata Tech Park','normal');
    const {analyses}=analyzeComparison(routes,plan=>fixtureScans(plan,'normal'),TUTORIAL_CHECKED_AT);
    const roads=fixtureRoadEvidence(routes,'normal');
    const baseline=compareActivity(routes,analyses,roads,{now});
    analyses[0].cameras={...evidence([]),routeId:routes[0].id,path:routes[0].path};
    const partial=compareActivity(routes,analyses,roads,{now});
    expect(partial.scores).toEqual(baseline.scores);
    expect(partial.commonComponents).not.toContain('cameraCoverage');
    analyses.forEach((a,i)=>{a.cameras={...evidence([]),routeId:routes[i].id,path:routes[i].path};});
    const complete=compareActivity(routes,analyses,roads,{now});
    expect(complete.commonComponents).toContain('cameraCoverage');
    expect(complete.commonComponents).toHaveLength(7);
    expect(complete.scores[routes[0].id]).toBeCloseTo(baseline.scores[routes[0].id]*.85);
    expect(compareActivity(routes,analyses,roads,{now:now+CAMERA_FRESHNESS_MS}).scores).toEqual(baseline.scores);
  });
  it('can recommend a short alternative because of stronger camera evidence',()=>{
    const fixtures=sampleRouteOptions('Manyata Tech Park','normal');
    const base=analyzeComparison(fixtures,plan=>fixtureScans(plan,'normal'),TUTORIAL_CHECKED_AT).analyses[0];
    const alternative={...route,id:'b',durationSeconds:630};
    const analyses=[{...base,routeId:'a',distanceMeters:2000,cameras:evidence([])},
      {...base,routeId:'b',distanceMeters:2000,cameras:{...evidence([250,750,1250,1750]),routeId:'b'}}];
    const roads={a:{mainRoadFraction:1,maneuversPerKm:0},b:{mainRoadFraction:1,maneuversPerKm:0}};
    const result=compareActivity([route,alternative],analyses,roads,{now});
    expect(result.scores.b-result.scores.a).toBeCloseTo(15);
    expect(result.recommendedId).toBe('b');
    expect(result.message).toContain('mapped camera locations');
    expect(compareActivity([route,alternative],analyses,roads,{now:now+CAMERA_FRESHNESS_MS}).selectedId).toBe('a');
  });
});

describe('Mappls route report boundary (synthetic fixtures)',()=>{
  // 123 is a test-only category, not a claimed Mappls camera category ID.
  const options={routeId:'provider-route',routeIndex:1,checkedAt:new Date(now).toISOString(),cameraCategories:new Map([[123,'traffic-camera' as const]]),expiryUnit:'seconds' as const};
  const row={id:'cam',childCategoryId:123,status:'Published',...point(250),expiry:Math.floor(now/1000)+60};
  const payload=(rows:unknown[])=>({routes:[{routeId:options.routeId,index:1,reportDetails:rows}]});
  it('requires a matching route index and explicitly configured category access',()=>{
    expect(parseMapplsCameraReports(route,payload([row]),{...options,routeIndex:0}).status).toBe('unavailable');
    expect(parseMapplsCameraReports(route,payload([]),{...options,cameraCategories:new Map()}).status).toBe('unavailable');
    expect(parseMapplsCameraReports(route,{routes:[]},options).status).toBe('unavailable');
  });
  it('excludes speed breakers and unpublished records, parses expiry, and rejects off-route cameras',()=>{
    const e=parseMapplsCameraReports(route,payload([row,{...row,id:'breaker',childCategoryId:456},{...row,id:'unpublished',status:'Unpublished'}]),options);
    expect(e.status).toBe('complete');expect(e.reports).toHaveLength(1);
    expect(e.reports[0].expiresAt).toBe(new Date(now+60_000).toISOString());
    expect(summarizeCameras(route,e,now)?.count).toBe(1);
    expect(parseMapplsCameraReports(route,payload([{...row,...point(250,100)}]),options).status).toBe('partial');
    expect(parseMapplsCameraReports(route,payload([{...row,expiry:'invalid'}]),options).status).toBe('partial');
  });
});
