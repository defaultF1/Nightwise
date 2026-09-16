import { describe, it, expect, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readConfig } from '../../server/config';
import { createServer } from '../../server/app';
import { parseMapplsRoutes, encodeMapplsPath, MapplsProvider, MAPPLS_CATEGORIES } from '../../server/mappls';
import { decodePolyline } from '../../server/google';
import { DEFAULT_JOURNEY } from '../../src/domain/journey';
import type { Coordinate } from '../../src/domain/types';
import type { BudgetStore } from '../../server/budget';

const folders: string[] = [];
afterEach(() => { for (const f of folders.splice(0)) rmSync(f, { recursive: true, force: true }); });
function ledger() { const f = mkdtempSync(join(tmpdir(), 'nightwise-mappls-')); folders.push(f); return join(f, 'counts.json'); }
function config(extra: NodeJS.ProcessEnv = {}) { return readConfig({ ENABLE_LIVE_REQUESTS: 'true', ROAD_DATA_PATH: 'missing-test-road-file', MAPPLS_SERVER_KEY: 'test-key-not-real', BUDGET_LEDGER_PATH: ledger(), ...extra }); }

const path: Coordinate[] = [{ latitude: 13.0628, longitude: 77.5941 }, { latitude: 13.055, longitude: 77.607 }, { latitude: 13.0477, longitude: 77.6199 }];
const lineString = (points: Coordinate[]) => ({ type: 'LineString', coordinates: points.map(p => [p.longitude, p.latitude]) });
const mapplsRoutes = {
  code: 'Ok',
  routes: [
    { geometry: lineString(path), distance: 5000, duration: 900, legs: [{ steps: [{ maneuver: { type: 'turn' } }, { maneuver: { type: 'depart' } }] }] },
    { geometry: lineString([path[0], { latitude: 13.052, longitude: 77.6 }, path[2]]), distance: 5600, duration: 700, legs: [] },
    { geometry: lineString(path), distance: 5000, duration: 900, legs: [] },
  ],
};
function fakeBudget(): BudgetStore & { reserved: string[] } {
  const reserved: string[] = [];
  return { reserved, reserve(kind) { reserved.push(kind); }, canScan: () => true, close() { /* nothing to release */ },
    snapshot: () => ({ routeCalls: 0, nearbyCalls: 0, autocompleteCalls: 0, detailsCalls: 0, routeLimit: 10, nearbyLimit: 600, autocompleteLimit: 40, detailsLimit: 20, remainingComparisons: 10 }) };
}

describe('mappls route parsing', () => {
  it('sorts by duration, labels, deduplicates identical geometry and keeps provider metadata', () => {
    const routes = parseMapplsRoutes(structuredClone(mapplsRoutes));
    expect(routes).toHaveLength(2);
    expect(routes[0]).toMatchObject({ label: 'Fastest route', durationSeconds: 700, source: 'mappls', geometryKind: 'provider' });
    expect(routes[1]).toMatchObject({ label: 'Alternative 1', durationSeconds: 900, turns: 1 });
  });
  it('rejects missing geometry, non-Ok responses and out-of-area paths', () => {
    expect(() => parseMapplsRoutes({ code: 'NoRoute' })).toThrow();
    expect(() => parseMapplsRoutes({ code: 'Ok', routes: [{ geometry: { type: 'Point' }, distance: 1, duration: 1 }] })).toThrow();
    expect(() => parseMapplsRoutes({ code: 'Ok', routes: [{ geometry: lineString([{ latitude: 28.6, longitude: 77.2 }, { latitude: 28.61, longitude: 77.21 }]), distance: 1500, duration: 60 }] })).toThrow();
  });
  it('encodes paths that Mappls-compatible polyline decoders can read back', () => {
    const decoded = decodePolyline(encodeMapplsPath(path));
    decoded.forEach((p, i) => { expect(p.latitude).toBeCloseTo(path[i].latitude, 5); expect(p.longitude).toBeCloseTo(path[i].longitude, 5); });
  });
});

describe('mappls along-route listings', () => {
  const poi = (id: string, distance?: number) => ({ place_id: id, poi: 'Place ' + id, address: 'Address', ...(distance !== undefined ? { distance } : {}) });
  it('fetches one page per category when Mappls reports a single page and keeps along-route distance', async () => {
    const calls = vi.fn(async () => new Response(JSON.stringify({ suggestedPOIs: [poi('ABC123', 514), poi('DEF456')], pageInfo: { totalPages: 1 } })));
    const provider = new MapplsProvider('k', fakeBudget(), calls as unknown as typeof fetch);
    const result = await provider.alongRoute({ id: 'r', label: 'x', durationSeconds: 600, distanceMeters: 5000, path, source: 'mappls', geometryKind: 'provider' }, new AbortController().signal);
    expect(calls).toHaveBeenCalledTimes(MAPPLS_CATEGORIES.length);
    expect(result.complete).toBe(true);
    expect(result.places[0]).toMatchObject({ id: 'ABC123', alongRouteMeters: 514 });
    expect(result.places.find(p => p.id === 'DEF456')?.alongRouteMeters).toBeUndefined();
  });
  it('fetches a second page only when reported, marks deeper results incomplete and respects the call cap', async () => {
    const calls = vi.fn(async () => new Response(JSON.stringify({ suggestedPOIs: [poi('AAA111')], pageInfo: { totalPages: 3 } })));
    const provider = new MapplsProvider('k', fakeBudget(), calls as unknown as typeof fetch);
    const capped = await provider.alongRoute({ id: 'r', label: 'x', durationSeconds: 600, distanceMeters: 5000, path, source: 'mappls', geometryKind: 'provider' }, new AbortController().signal, false, 3);
    expect(calls).toHaveBeenCalledTimes(3);
    expect(capped.complete).toBe(false);
  });
});

describe('mappls live server', () => {
  const fetcher = vi.fn(async (url: string | URL | Request) => {
    const value = String(url);
    if (value.includes('route.mappls.com')) {
      if (/;[A-Z0-9]{6}\?/i.test(value)) return new Response(JSON.stringify({ code: 'Ok', waypoints: [{ location: [77.5941, 13.0628] }, { location: [77.607, 13.055] }] }));
      return new Response(JSON.stringify(structuredClone(mapplsRoutes)));
    }
    if (value.includes('along-route')) return new Response(JSON.stringify({ suggestedPOIs: [{ place_id: '318T5B', poi: 'Indian Oil Petrol Pump', address: 'Bellary Road', distance: 514 }], pageInfo: { totalPages: 1 } }));
    if (value.includes('autosuggest')) return new Response(JSON.stringify({ suggestedLocations: [{ eLoc: '8C8J9C', placeName: 'Maruthi Medicals', placeAddress: 'Dasarahalli Main Road', distance: 63, type: 'POI' }] }));
    throw new Error('Unexpected URL ' + value);
  });
  it('serves Mappls routes with listed places, forced-partial activity and Mappls attribution', async () => {
    const app = await createServer(config({ ENABLE_ACTIVITY_ANALYSIS: 'true' }), fetcher as unknown as typeof fetch);
    try {
      const status = (await app.inject('/api/status')).json();
      expect(status).toMatchObject({ provider: 'mappls', futureDepartureEnabled: false, camerasEnabled: false, searchPreviewEnabled: false, ready: true });
      const result = await app.inject({ method: 'POST', url: '/api/compare', payload: DEFAULT_JOURNEY });
      expect(result.statusCode).toBe(200);
      const body = result.json();
      expect(body.routes).toHaveLength(2);
      expect(body.routes.every((r: { source: string; geometryKind: string }) => r.source === 'mappls' && r.geometryKind === 'provider')).toBe(true);
      expect(body.routes[0].listedPlaces).toEqual([{ id: '318T5B', name: 'Indian Oil Petrol Pump', address: 'Bellary Road', category: expect.any(String), kind: expect.any(String), alongRouteMeters: 514 }]);
      expect(body.activityStatus).toBe('partial');
      expect(body.attributions.some((a: { name: string }) => a.name.includes('Mappls'))).toBe(true);
      expect(body.notices.join(' ')).toContain('not drawn as map pins');
    } finally { await app.close(); }
  });
  it('rejects future departures before any Mappls request is billed', async () => {
    const calls = vi.fn(async () => new Response('{}'));
    const app = await createServer(config(), calls as unknown as typeof fetch);
    try {
      const result = await app.inject({ method: 'POST', url: '/api/compare', payload: { ...DEFAULT_JOURNEY, departureTime: new Date(Date.now() + 60 * 60_000).toISOString() } });
      expect(result.statusCode).toBe(422);
      expect(result.json().code).toBe('departure-unavailable');
      expect(calls).not.toHaveBeenCalled();
    } finally { await app.close(); }
  });
  it('suggests and resolves places through Mappls sessions, labelling road access points', async () => {
    const app = await createServer(config({ ENABLE_PLACE_SEARCH: 'true' }), fetcher as unknown as typeof fetch);
    try {
      const token = '00000000-0000-4000-8000-000000000000';
      const suggest = await app.inject({ method: 'POST', url: '/api/places/suggest', payload: { query: 'maruthi', sessionToken: token } });
      expect(suggest.statusCode).toBe(200);
      expect(suggest.json().suggestions[0]).toMatchObject({ id: '8C8J9C', title: 'Maruthi Medicals' });
      const resolve = await app.inject({ method: 'POST', url: '/api/places/resolve', payload: { placeId: '8C8J9C', sessionToken: token } });
      expect(resolve.statusCode).toBe(200);
      expect(resolve.json().coordinate).toEqual({ latitude: 13.055, longitude: 77.607 });
      expect(resolve.json().address).toContain('Road access point');
      const reused = await app.inject({ method: 'POST', url: '/api/places/resolve', payload: { placeId: '8C8J9C', sessionToken: token } });
      expect(reused.statusCode).toBe(400);
    } finally { await app.close(); }
  });
});
