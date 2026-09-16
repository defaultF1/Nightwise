import {test,expect} from 'vitest';
import {cameraRouteEvidence,cameraEvidenceForRoutes} from '../../src/domain/camera-score';
import {compareActivity,WEIGHTS,WALK_WEIGHTS} from '../../src/domain/comparison';
import {buildQueryPlan,analyzeRoute} from '../../src/domain/activity';
import {pathLength} from '../../src/domain/geometry';
import type {MappedCamera} from '../../src/domain/camera-layer';
import type {Route} from '../../src/domain/types';
const origin={latitude:13.0553,longitude:77.607};
const point=(m:number)=>({...origin,longitude:origin.longitude+m/(111195*Math.cos(origin.latitude*Math.PI/180))});
// Keep the geometry away from an exact 500 m boundary: tangent-plane fixture
// coordinates and the spherical distance function differ by a few millimetres.
const path=[point(0),point(1990)];
const camera=(m:number,id=String(m),zone='public'):MappedCamera=>({...point(m),id,zone});
const evidence=(records:MappedCamera[])=>cameraRouteEvidence(path,2000,records)!;

test('camera evidence is bounded and uses actual route proximity, zone and distinct sites',()=>{
 const a=evidence([camera(250)]);
 expect(a.count).toBe(1);expect(a.value).toBeGreaterThan(0);expect(a.value).toBeLessThan(1);
 expect(evidence([camera(250),camera(250),camera(255,'duplicate-site')])).toEqual(a);
 expect(evidence([camera(250,'private','private'),camera(750,'indoor','indoor'),{...camera(1000),latitude:13.06}]).value).toBe(0);
 expect(evidence([]).value).toBe(0);
});
test('distribution matters and concentrated cameras cannot fill all camera points',()=>{
 const spread=evidence([camera(250),camera(750),camera(1250),camera(1750)]);
 const cluster=evidence([camera(200),camera(220),camera(240),camera(260)]);
 expect(spread.density).toBe(cluster.density);expect(spread.value).toBeGreaterThan(cluster.value);
 expect(spread.spread).toBe(1);expect(cluster.spread).toBe(.25);
 expect(cameraRouteEvidence([...path].reverse(),2000,[camera(250),camera(750),camera(1250),camera(1750)])!.value).toBeCloseTo(spread.value);
 expect(evidence(Array.from({length:40},(_,i)=>camera(15+i*12))).value).toBeLessThan(.7);
});
test('invalid geometry and areas outside the extract do not invent camera evidence',()=>{
 for(const distance of [0,-1,NaN,Infinity])expect(cameraRouteEvidence(path,distance,[])).toBeUndefined();
 expect(cameraRouteEvidence([origin],1000,[])).toBeUndefined();
 expect(cameraRouteEvidence([{latitude:26.48,longitude:80.30},{latitude:26.49,longitude:80.31}],1000,[])).toBeUndefined();
 const r:Route={id:'a',label:'A',path,distanceMeters:2000,durationSeconds:600,source:'sample',geometryKind:'illustrative'};
 expect(cameraEvidenceForRoutes([r])).toEqual({});
});
test('cameras add exactly their numerical contribution in both travel modes',()=>{
 const r:Route={id:'a',label:'A',path,distanceMeters:pathLength(path),durationSeconds:600,source:'geoapify',geometryKind:'provider'};
 const plan=buildQueryPlan([r]);
 const checkedAt='2026-09-16T12:00:00+05:30';
 const a=analyzeRoute(r,plan,plan.queries.map(q=>({queryId:q.id,observedAt:checkedAt,status:'ok',places:[]})),checkedAt);
 for(const mode of ['DRIVE','WALK'] as const){
  const options={mode,allowLive:true};
  const before=compareActivity([r],[a],{},options);
  const cameraEvidence={a:evidence([camera(250),camera(1250)])};
  const after=compareActivity([r],[a],{},{...options,cameraEvidence});
  expect(after.scores.a-before.scores.a).toBeCloseTo(10*cameraEvidence.a.value);
  expect(after.commonComponents).toContain('cameras');expect(after.cameraEvidence).toEqual(cameraEvidence);
 }
 expect(Object.values(WEIGHTS).reduce((a,b)=>a+b,0)).toBe(100);
 expect(Object.values(WALK_WEIGHTS).reduce((a,b)=>a+b,0)).toBe(100);
});
test('routes share the same camera comparison basis',()=>{
 const routes=['a','b'].map(id=>({id,label:id,path,distanceMeters:2000,durationSeconds:600,source:'geoapify' as const,geometryKind:'provider' as const}));
 const checkedAt='2026-09-16T12:00:00+05:30',plan=buildQueryPlan(routes);
 const analyses=routes.map(r=>analyzeRoute(r,plan,plan.queries.map(q=>({queryId:q.id,observedAt:checkedAt,status:'ok' as const,places:[]})),checkedAt));
 const result=compareActivity(routes,analyses,{},{allowLive:true,cameraEvidence:{a:evidence([camera(250)])}});
 expect(result.commonComponents).not.toContain('cameras');expect(result.scores.a).toBe(result.scores.b);
});
