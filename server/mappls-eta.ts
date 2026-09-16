import type { Coordinate, TravelMode } from '../src/domain/types';

// Live travel time from Mappls for one displayed route, guided along that
// route's own road points. Used only to correct durations: geometry, places,
// scoring and budgets stay with the primary provider. Every failure returns
// null so approximated times remain available.
const cache = new Map<string, { at: number; seconds: number }>();
let day = new Date().toDateString(); let calls = 0;
// A hard daily safety cap, separate from the Geoapify ledger, so a runaway
// client cannot spend the Mappls allowance unnoticed.
export const MAPPLS_ETA_DAILY_CAP = 400;
export function mapplsEtaCallsToday() { const today = new Date().toDateString(); if (today !== day) { day = today; calls = 0; } return calls; }

export async function mapplsLiveSeconds(key: string, mode: TravelMode, points: Coordinate[], signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<number | null> {
  if (!key || points.length < 2 || points.length > 8) return null;
  if (mapplsEtaCallsToday() >= MAPPLS_ETA_DAILY_CAP) return null;
  const profile = mode === 'WALK' ? 'walking' : mode === 'TWO_WHEELER' ? 'biking' : 'driving';
  const resource = profile === 'walking' ? 'route_adv' : 'route_eta';
  const path = points.map(p => `${p.longitude.toFixed(6)},${p.latitude.toFixed(6)}`).join(';');
  const cacheKey = profile + path; const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < 180000) return hit.seconds;
  calls++;
  try {
    const response = await fetcher(`https://route.mappls.com/route/direction/${resource}/${profile}/${path}?${new URLSearchParams({ geometries: 'geojson', alternatives: 'false', steps: 'false', access_token: key })}`,
      { signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]), redirect: 'error' });
    if (!response.ok) return null;
    const data = await response.json();
    const seconds = data?.code === 'Ok' ? Number(data.routes?.[0]?.duration) : NaN;
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 21600) return null;
    const rounded = Math.round(seconds);
    if (cache.size >= 200) cache.delete(cache.keys().next().value!);
    cache.set(cacheKey, { at: Date.now(), seconds: rounded });
    return rounded;
  } catch { return null; }
}
