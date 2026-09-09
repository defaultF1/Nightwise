import type { LiveJourney } from '../src/domain/journey';
import { inBengaluru } from '../src/domain/journey';
import type { Route, Coordinate } from '../src/domain/types';
import type { NearbyQuery, NearbyScan, PlaceObservation } from '../src/domain/activity-types';
import { validateRoutes } from '../src/providers/routes';
import { ServiceError } from './errors';
import type { Budget } from './budget';

type Json = Record<string, any>;
export const ROUTE_FIELDS = 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction.maneuver,routes.legs.steps.distanceMeters,routes.legs.steps.polyline.encodedPolyline';
export const PLACE_FIELDS = 'places.id,places.location,places.types,places.businessStatus,places.currentOpeningHours,places.attributions';
export function decodePolyline(encoded: string): Coordinate[] {
  if (typeof encoded !== 'string' || encoded.length > 50000) throw new ServiceError('invalid-response', 'Route geometry could not be read.');
  let index = 0, latitude = 0, longitude = 0; const points: Coordinate[] = [];
  const component = () => {
    let value = 0, shift = 0, byte: number;
    do {
      if (index >= encoded.length || shift > 30) throw new ServiceError('invalid-response', 'Route geometry is incomplete.');
      byte = encoded.charCodeAt(index++) - 63;
      if (byte < 0 || byte > 63) throw new ServiceError('invalid-response', 'Route geometry is invalid.');
      value += (byte & 31) * 2 ** shift; shift += 5;
    } while (byte >= 32);
    return value % 2 ? -(Math.floor(value / 2) + 1) : value / 2;
  };
  while (index < encoded.length) {
    latitude += component(); longitude += component();
    points.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
    if (points.length > 4000) throw new ServiceError('invalid-response', 'Route is too detailed for this pilot.');
  }
  return points;
}
export function parseRoutes(data: Json): Route[] {
  if (data.routes === undefined) return [];
  if (!Array.isArray(data.routes) || data.routes.length > 4) throw new ServiceError('invalid-response', 'Unexpected route options.');
  const paths = new Set<string>();
  const routes = data.routes.map((r: Json, index: number): Route => {
    if (typeof r.duration !== 'string' || !/^\d+(\.\d+)?s$/.test(r.duration) || typeof r.distanceMeters !== 'number') throw new ServiceError('invalid-response', 'Route time or distance is missing.');
    const path = decodePolyline(r.polyline?.encodedPolyline);
    if (path.some(p => !inBengaluru(p))) throw new ServiceError('outside-area', 'A route leaves this Bengaluru pilot area.', 422);
    const steps: Json[] = Array.isArray(r.legs) ? r.legs.flatMap((l: Json) => Array.isArray(l.steps) ? l.steps : []) : [];
    const maneuvers = steps.map(s => s.navigationInstruction?.maneuver);
    const turns = maneuvers.length && maneuvers.every(m => typeof m === 'string') ? maneuvers.filter(m => /TURN|U_TURN|ROUNDABOUT/.test(m)).length : undefined;
    const parsedSteps=steps.filter(s=>Number.isFinite(s.distanceMeters)&&s.distanceMeters>=0).map(s=>{
      const path=typeof s.polyline?.encodedPolyline==='string'?decodePolyline(s.polyline.encodedPolyline):undefined;
      if(path?.some(p=>!inBengaluru(p)))throw new ServiceError('outside-area','A route step leaves the Bengaluru pilot area.',422);
      return {distanceMeters:s.distanceMeters,...(typeof s.navigationInstruction?.maneuver==='string'?{maneuver:s.navigationInstruction.maneuver}:{}),...(path?{path}:{})};
    });
    return { id: `google:${index}`, label: `Alternative ${index + 1}`, path, distanceMeters: r.distanceMeters, durationSeconds: Number(r.duration.slice(0, -1)), source: 'google', geometryKind: 'provider', turns, steps:parsedSteps };
  }).filter((r: Route) => { const key = JSON.stringify(r.path); if (paths.has(key)) return false; paths.add(key); return true; });
  routes.sort((a: Route, b: Route) => a.durationSeconds - b.durationSeconds);
  routes.forEach((r: Route, i: number) => { r.label = i ? `Alternative ${i}` : 'Fastest'; });
  return validateRoutes(routes);
}

export function parseScan(data: Json, queryId: string, observedAt: string): { scan: NearbyScan; attributions: { name: string; uri?: string }[] } {
  if (data.places !== undefined && !Array.isArray(data.places)) throw new ServiceError('invalid-response', 'Nearby results could not be read.');
  const input: Json[] = data.places || [];
  if (input.length > 20) throw new ServiceError('invalid-response', 'Unexpected nearby result count.');
  let malformed = false;
  const attributions: { name: string; uri?: string }[] = [];
  const places = input.flatMap((p): PlaceObservation[] => {
    if (typeof p.id !== 'string' || !p.id || !inBengaluru(p.location) || !Array.isArray(p.types) || !p.types.every((t: unknown) => typeof t === 'string')) { malformed = true; return []; }
    for (const a of p.attributions || []) if (typeof a.provider === 'string') attributions.push({ name: a.provider, uri: typeof a.providerUri === 'string' && a.providerUri.startsWith('https://') ? a.providerUri : undefined });
    // Current openNow + nextCloseTime account for special dates. Do not turn
    // incomplete weekly hours into an open/closed guess or claim actual staffing.
    const hours = p.currentOpeningHours;
    const currentHours = p.businessStatus === 'OPERATIONAL' && typeof hours?.openNow === 'boolean'
      ? { openNow: hours.openNow, nextCloseTime: typeof hours.nextCloseTime === 'string' ? hours.nextCloseTime : undefined, observedAt } : undefined;
    return [{ id: p.id, coordinate: p.location, categories: p.types, observedAt, currentHours }];
  });
  return { scan: { queryId, observedAt, status: malformed ? 'failed' : input.length === 20 ? 'capped' : 'ok', places }, attributions };
}

export class GoogleProvider {
  constructor(private key: string, private budget: Budget, private fetcher: typeof fetch = fetch) {}
  private async post(url: string, fields: string, body: Json, signal: AbortSignal): Promise<Json> {
    signal.throwIfAborted();
    try {
      const response = await this.fetcher(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': this.key, 'X-Goog-FieldMask': fields }, body: JSON.stringify(body), signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) });
      if (!response.ok) throw new ServiceError(response.status === 429 ? 'provider-quota' : response.status === 403 || response.status === 401 ? 'provider-access' : 'provider-unavailable', response.status === 403 || response.status === 401 ? 'Google access is not ready. Check API restrictions, enabled services and billing.' : 'Google could not finish this request. No automatic retry was made.');
      // Provider error bodies/headers can contain sensitive configuration. Never log them.
      const text = await response.text();
      if (text.length > 2_000_000) throw new ServiceError('invalid-response', 'The provider response was too large.');
      return JSON.parse(text);
    } catch (e) {
      if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      if (e instanceof ServiceError) throw e;
      throw new ServiceError('provider-unavailable', 'The provider timed out or returned an unreadable response. No automatic retry was made.');
    }
  }
  async routes(journey: LiveJourney, signal: AbortSignal) {
    signal.throwIfAborted(); this.budget.reserve('route');
    const data = await this.post('https://routes.googleapis.com/directions/v2:computeRoutes', ROUTE_FIELDS, {
      origin: { location: { latLng: { latitude: journey.origin.latitude, longitude: journey.origin.longitude } } },
      destination: { location: { latLng: { latitude: journey.destination.latitude, longitude: journey.destination.longitude } } },
      travelMode: 'DRIVE', computeAlternativeRoutes: true, routingPreference: 'TRAFFIC_AWARE', polylineQuality: 'HIGH_QUALITY', languageCode: 'en-IN', units: 'METRIC',
    }, signal);
    return parseRoutes(data);
  }
  async nearby(query: NearbyQuery, signal: AbortSignal) {
    signal.throwIfAborted(); this.budget.reserve('nearby');
    const data = await this.post('https://places.googleapis.com/v1/places:searchNearby', PLACE_FIELDS, {
      includedTypes: ['restaurant', 'cafe', 'gas_station', 'hospital', 'hotel', 'pharmacy', 'police', 'convenience_store', 'supermarket', 'transit_station'],
      maxResultCount: 20, rankPreference: 'DISTANCE', languageCode: 'en',
      locationRestriction: { circle: { center: query.coordinate, radius: query.radiusMeters } },
    }, signal);
    return parseScan(data, query.id, new Date().toISOString());
  }
}
