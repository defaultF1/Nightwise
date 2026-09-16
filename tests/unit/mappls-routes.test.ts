import { test, expect, vi } from 'vitest';
import { parseMapplsLiveRoutes, mapplsLiveRoutes } from '../../server/mappls-routes';
import type { LiveJourney } from '../../src/domain/journey';
import type { Coordinate } from '../../src/domain/types';

const journey: LiveJourney = { origin: { name: 'AEOS', latitude: 13.0628, longitude: 77.5941 }, destination: { name: 'Manyata', latitude: 13.0477, longitude: 77.6199 }, mode: 'DRIVE' };
const line = (points: Coordinate[]) => ({ type: 'LineString', coordinates: points.map(p => [p.longitude, p.latitude]) });
const a = [journey.origin, { latitude: 13.058, longitude: 77.601 }, { latitude: 13.052, longitude: 77.612 }, journey.destination];
const b = [journey.origin, { latitude: 13.066, longitude: 77.603 }, { latitude: 13.056, longitude: 77.617 }, journey.destination];
const ok = {
  code: 'Ok', routes: [
    { geometry: line(a), distance: 5400, duration: 1004.2, legs: [{ steps: [{ maneuver: { type: 'turn' } }, { maneuver: { type: 'depart' } }] }] },
    { geometry: line(b), distance: 6100, duration: 960.9, legs: [] },
    { geometry: line(a), distance: 5400, duration: 1010, legs: [] },
  ],
};

test('live routes come sorted by Mappls time with near-duplicates collapsed and rounded values', () => {
  const routes = parseMapplsLiveRoutes(structuredClone(ok), journey)!;
  expect(routes).toHaveLength(2);
  expect(routes[0]).toMatchObject({ label: 'Fastest', durationSeconds: 961, distanceMeters: 6100, source: 'geoapify', geometryKind: 'provider' });
  expect(routes[1]).toMatchObject({ label: 'Alternative 1', durationSeconds: 1004, turns: 1 });
});

test('anything untrustworthy makes the whole engine step aside instead of guessing', () => {
  expect(parseMapplsLiveRoutes({ code: 'NoRoute' }, journey)).toBeNull();
  expect(parseMapplsLiveRoutes({ code: 'Ok', routes: [{ geometry: { type: 'Point' }, distance: 1, duration: 1 }] }, journey)).toBeNull();
  const far = { code: 'Ok', routes: [{ geometry: line([{ latitude: 28.6, longitude: 77.2 }, { latitude: 28.61, longitude: 77.21 }]), distance: 1500, duration: 300, legs: [] }] };
  expect(parseMapplsLiveRoutes(far, journey)).toBeNull();
  const detached = { code: 'Ok', routes: [{ geometry: line([{ latitude: 13.03, longitude: 77.58 }, { latitude: 13.035, longitude: 77.6 }]), distance: 1500, duration: 300, legs: [] }] };
  expect(parseMapplsLiveRoutes(detached, journey)).toBeNull();
});

test('the fetch path builds a single alternatives request and fails closed', async () => {
  const fetcher = vi.fn(async (_url: string | URL | Request) => new Response(JSON.stringify(ok)));
  const signal = new AbortController().signal;
  const routes = await mapplsLiveRoutes('key', journey, signal, true, fetcher as unknown as typeof fetch);
  expect(routes).toHaveLength(2);
  const url = String(fetcher.mock.calls[0][0]);
  expect(url).toContain('route_eta/driving/77.594100,13.062800;77.619900,13.047700');
  expect(url).toContain('alternatives=true');
  expect(await mapplsLiveRoutes('key', journey, signal, true, (async () => { throw new Error('offline'); }) as unknown as typeof fetch)).toBeNull();
  expect(await mapplsLiveRoutes('key', journey, signal, true, (async () => new Response('{}', { status: 401 })) as unknown as typeof fetch)).toBeNull();
  expect(await mapplsLiveRoutes('', journey, signal)).toBeNull();
});
