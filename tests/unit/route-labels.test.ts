import { test, expect } from 'vitest';
import { labelRoutes } from '../../src/domain/route-labels';
import type { Route } from '../../src/domain/types';
import type { Comparison } from '../../src/domain/activity-types';

const route = (id: string, durationSeconds: number): Route => ({ id, label: id, durationSeconds, distanceMeters: 6000, path: [{ latitude: 13.06, longitude: 77.59 }, { latitude: 13.05, longitude: 77.62 }], source: 'geoapify', geometryKind: 'provider' });
const comparison = (fastestId: string, scores: Record<string, number>): Comparison => ({ version: 'v', fastestId, selectedId: fastestId, recommendedId: null, outcome: 'compared', message: '', commonComponents: [], scores, componentScores: {}, rankedIds: Object.keys(scores) } as unknown as Comparison);

test('names the fastest, the top-scored safest, and numbers the rest', () => {
  const routes = [route('a', 600), route('b', 900), route('c', 1200)];
  const labels = labelRoutes(routes, comparison('a', { a: 40, b: 62, c: 55 })).map(r => r.label);
  expect(labels).toEqual(['Fastest route', 'Safest route', 'Alternative 1']);
});

test('one route can be both fastest and safest, and near-ties prefer more mapped cameras', () => {
  const routes = [route('a', 600), route('b', 900)];
  expect(labelRoutes(routes, comparison('a', { a: 70, b: 50 })).map(r => r.label)).toEqual(['Fastest & safest route', 'Alternative 1']);
  const tied = labelRoutes(routes, comparison('a', { a: 60, b: 61 }), { a: 9, b: 2 }).map(r => r.label);
  expect(tied).toEqual(['Fastest & safest route', 'Alternative 1']);
});

test('never claims safest without scores and leaves single routes alone', () => {
  const routes = [route('a', 600), route('b', 900)];
  const labels = labelRoutes(routes, comparison('a', {})).map(r => r.label);
  expect(labels.join(' ')).not.toContain('Safest');
  expect(labels[0]).toBe('Fastest route');
  expect(labelRoutes([route('a', 600)], comparison('a', { a: 50 }))[0].label).toBe('a');
});

test('estimated or insufficient comparisons retain neutral alternatives',()=>{
 const routes=[route('a',600),route('b',900)];
 for(const extra of [{estimated:true},{outcome:'insufficient' as const}]){
  expect(labelRoutes(routes,{...comparison('a',{a:10,b:50}),...extra}).map(r=>r.label)).toEqual(['Fastest route','Alternative 1']);
 }
});
test('camera tie-break uses a fixed highest-score band regardless of input order',()=>{
 const routes=[route('a',600),route('b',900),route('c',1200)];
 const c=comparison('a',{a:100,b:98,c:96});
 const cameras={a:0,b:1,c:2};
 for(const order of [routes,[...routes].reverse(),[routes[1],routes[2],routes[0]]]){
  expect(labelRoutes(order,c,cameras).find(r=>r.label==='Safest route')?.id).toBe('b');
 }
});
