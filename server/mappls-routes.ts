import { createHash } from 'node:crypto';
import type { Coordinate, Route } from '../src/domain/types';
import { distanceMeters } from '../src/domain/geometry';
import { distinctRoadShare } from '../src/domain/route-proximity';
import { AEOS_PIN, type LiveJourney } from '../src/domain/journey';

// One Mappls directions request supplies road geometry AND live travel time
// together, so the displayed fastest option can never disagree with the
// navigation app users open next. Any problem returns null and the caller
// falls back to the Geoapify engine wholesale: providers are never mixed
// inside one comparison, because mixed clocks cannot be ranked honestly.
//
// Wire note: returned routes keep source 'geoapify' because deployed clients
// validate that exact tag; the response notices and attributions state that
// roads and times came from Mappls whenever this engine is used.
const cache = new Map<string, { at: number; routes: Route[] }>();
let day = new Date().toDateString(); let calls = 0;
export const MAPPLS_ROUTE_DAILY_CAP = 600;

export function parseMapplsLiveRoutes(data: unknown, journey: LiveJourney): Route[] | null {
  const body = data as { code?: string; routes?: unknown[] };
  if (body?.code !== 'Ok' || !Array.isArray(body.routes)) return null;
  const parsed: Route[] = [];
  for (const raw of body.routes.slice(0, 6)) {
    const r = raw as { geometry?: { type?: string; coordinates?: unknown[] }; distance?: number; duration?: number; legs?: { steps?: { maneuver?: { type?: string } }[] }[] };
    if (r.geometry?.type !== 'LineString' || !Array.isArray(r.geometry.coordinates)) return null;
    const path: Coordinate[] = [];
    for (const p of r.geometry.coordinates) {
      if (!Array.isArray(p) || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) return null;
      path.push({ latitude: p[1] as number, longitude: p[0] as number });
    }
    if (path.length < 2 || path.length > 4000 || path.some(q => distanceMeters(q, AEOS_PIN) > 22000)) return null;
    if (!Number.isFinite(r.distance) || r.distance! <= 0 || r.distance! > 100000 || !Number.isFinite(r.duration) || r.duration! <= 0 || r.duration! > 21600) return null;
    if (distanceMeters(path[0], journey.origin) > 250 || distanceMeters(path.at(-1)!, journey.destination) > 250) continue;
    const steps = (r.legs ?? []).flatMap(l => Array.isArray(l.steps) ? l.steps : []);
    parsed.push({ id: `mappls:${createHash('sha256').update(JSON.stringify(path)).digest('hex').slice(0, 12)}`, label: 'Fastest',
      durationSeconds: Math.round(r.duration!), distanceMeters: Math.round(r.distance!), path, source: 'geoapify', geometryKind: 'provider',
      ...(steps.length ? { turns: steps.filter(s => /turn|roundabout|rotary|uturn/i.test(s.maneuver?.type ?? '')).length } : {}) });
  }
  // Collapse near-duplicates: an alternative sharing over 85% of its roads
  // with a kept option is the same choice wearing a different time.
  const distinct: Route[] = [];
  for (const route of parsed.sort((a, b) => a.durationSeconds - b.durationSeconds)) {
    if (distinct.every(kept => kept.id !== route.id && distinctRoadShare(route.path, kept.path) >= 0.15)) distinct.push(route);
    if (distinct.length === 4) break;
  }
  if (!distinct.length) return null;
  return distinct.map((r, i) => ({ ...r, label: i ? `Alternative ${i}` : 'Fastest' }));
}

export async function mapplsLiveRoutes(key: string, journey: LiveJourney, signal: AbortSignal, refresh = false, fetcher: typeof fetch = fetch): Promise<Route[] | null> {
  if (!key) return null;
  const today = new Date().toDateString(); if (today !== day) { day = today; calls = 0; }
  const profile = journey.mode === 'WALK' ? 'walking' : journey.mode === 'TWO_WHEELER' ? 'biking' : 'driving';
  const resource = profile === 'walking' ? 'route_adv' : 'route_eta';
  const points = [journey.origin, journey.destination].map(p => `${p.longitude.toFixed(6)},${p.latitude.toFixed(6)}`).join(';');
  const cacheKey = profile + points; const hit = cache.get(cacheKey);
  // Two minutes keeps repeat comparisons cheap while times stay live.
  if (!refresh && hit && Date.now() - hit.at < 120000) return structuredClone(hit.routes);
  if (calls >= MAPPLS_ROUTE_DAILY_CAP) return null;
  calls++;
  try {
    const response = await fetcher(`https://route.mappls.com/route/direction/${resource}/${profile}/${points}?${new URLSearchParams({ geometries: 'geojson', alternatives: 'true', steps: 'true', overview: 'full', access_token: key })}`,
      { signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]), redirect: 'error' });
    if (!response.ok) return null;
    const text = await response.text(); if (text.length > 2000000) return null;
    const routes = parseMapplsLiveRoutes(JSON.parse(text), journey);
    if (!routes) return null;
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(cacheKey, { at: Date.now(), routes });
    return structuredClone(routes);
  } catch { return null; }
}
