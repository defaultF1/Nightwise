import type { LiveJourney } from '../src/domain/journey';
import { inServiceMapArea } from '../src/domain/journey';
import type { Route, Coordinate } from '../src/domain/types';
import type { NearbyQuery, NearbyScan, PlaceObservation } from '../src/domain/activity-types';
import { validateRoutes } from '../src/providers/routes';
import { ServiceError } from './errors';
import type { BudgetStore } from './budget';
import { calendarHours, regularHours, scheduleDetails } from './opening-hours';

type Json = Record<string, any>;
export const ROUTE_FIELDS = 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction.maneuver,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.polyline.encodedPolyline';
export const PLACE_FIELDS = 'places.id,places.displayName,places.location,places.types,places.businessStatus,places.currentOpeningHours,places.regularOpeningHours,places.attributions';
// Broad night-relevant coverage: bakeries, malls, grocery and department
// stores were previously never requested, which left live streets looking
// emptier than they are. Same request cost — types ride on one nearby call.
export const SEARCH_PARTITIONS={places:['restaurant','cafe','convenience_store','supermarket','bakery','shopping_mall','grocery_store','department_store'],help:['gas_station','hospital','hotel','pharmacy','drugstore','police','transit_station']} as const;
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
    if (path.some(p => !inServiceMapArea(p))) throw new ServiceError('outside-area', 'A route leaves the supported city map area.', 422);
    const steps: Json[] = Array.isArray(r.legs) ? r.legs.flatMap((l: Json) => Array.isArray(l.steps) ? l.steps : []) : [];
    const maneuvers = steps.map(s => s.navigationInstruction?.maneuver);
    const turns = maneuvers.length && maneuvers.every(m => typeof m === 'string') ? maneuvers.filter(m => /TURN|U_TURN|ROUNDABOUT/.test(m)).length : undefined;
    const parsedSteps=steps.filter(s=>Number.isFinite(s.distanceMeters)&&s.distanceMeters>=0).map(s=>{
      const path=typeof s.polyline?.encodedPolyline==='string'?decodePolyline(s.polyline.encodedPolyline):undefined;
      if(path?.some(p=>!inServiceMapArea(p)))throw new ServiceError('outside-area','A route step leaves the supported city map area.',422);
      return {distanceMeters:s.distanceMeters,...(typeof s.staticDuration==='string'&&/^\d+(\.\d+)?s$/.test(s.staticDuration)?{staticDurationSeconds:Number(s.staticDuration.slice(0,-1))}:{}),...(typeof s.navigationInstruction?.maneuver==='string'?{maneuver:s.navigationInstruction.maneuver}:{}),...(path?{path}:{})};
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
    if (typeof p.id !== 'string' || !p.id || !inServiceMapArea(p.location) || !Array.isArray(p.types) || !p.types.every((t: unknown) => typeof t === 'string')) { malformed = true; return []; }
    for (const a of p.attributions || []) if (typeof a.provider === 'string') attributions.push({ name: a.provider, uri: typeof a.providerUri === 'string' && a.providerUri.startsWith('https://') ? a.providerUri : undefined });
    // Current openNow + nextCloseTime account for special dates. Do not turn
    // incomplete weekly hours into an open/closed guess or claim actual staffing.
    const hours = p.currentOpeningHours;
    const currentHours = p.businessStatus === 'OPERATIONAL' && typeof hours?.openNow === 'boolean'
      ? { openNow: hours.openNow, nextOpenTime: typeof hours.nextOpenTime === 'string' ? hours.nextOpenTime : undefined, nextCloseTime: typeof hours.nextCloseTime === 'string' ? hours.nextCloseTime : undefined, observedAt } : undefined;
    const calendar=p.businessStatus==='OPERATIONAL'?calendarHours(hours,observedAt):undefined;
    return [{ id: p.id, name: typeof p.displayName?.text==='string'?p.displayName.text.slice(0,150):undefined, coordinate: p.location, categories: p.types, observedAt, currentHours, calendarHours:calendar,
      businessStatus:p.businessStatus, hours:p.businessStatus==='OPERATIONAL'?regularHours(p.regularOpeningHours):undefined,hoursOrigin:'google-regular',schedule:scheduleDetails(hours,p.regularOpeningHours),currentScheduleInvalid:Array.isArray(hours?.periods)&&!calendar }];
  });
  return { scan: { queryId, observedAt, status: malformed ? 'failed' : input.length === 20 ? 'capped' : 'ok', places }, attributions };
}

type ScanResult = { scan: NearbyScan; attributions: { name: string; uri?: string }[] };
// Places change slowly: remembering results briefly stops the same street
// corner being paid for on every comparison. The TTL stays well inside the
// domain's 15-minute evidence freshness window, so cached observations are
// still treated as fresh. Failed scans are never cached.
export class PlacesCache {
  private entries = new Map<string, { at: number; result: ScanResult }>();
  constructor(private ttlMs = 10 * 60_000, private max = 600) {}
  private static key(query: NearbyQuery) { return `${query.coordinate.latitude},${query.coordinate.longitude},${query.radiusMeters},${query.partition ?? ''}`; }
  get(query: NearbyQuery): ScanResult | undefined {
    const key = PlacesCache.key(query), entry = this.entries.get(key);
    if (!entry) return;
    if (Date.now() - entry.at > this.ttlMs) { this.entries.delete(key); return; }
    const copy = structuredClone(entry.result);
    copy.scan.queryId = query.id;
    return copy;
  }
  set(query: NearbyQuery, result: ScanResult) {
    if (result.scan.status === 'failed') return;
    if (this.entries.size >= this.max) this.entries.delete(this.entries.keys().next().value!);
    this.entries.set(PlacesCache.key(query), { at: Date.now(), result: structuredClone(result) });
  }
}

export class GoogleProvider {
  private cache = new PlacesCache();
  private detailsCache = new Map<string, { at: number; result: ScanResult }>();
  constructor(private key: string, private budget: BudgetStore, private fetcher: typeof fetch = fetch) {}
  private async post(url: string, fields: string, body: Json | undefined, signal: AbortSignal): Promise<Json> {
    signal.throwIfAborted();
    try {
      const response = await this.fetcher(url, { method: body?'POST':'GET', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': this.key, 'X-Goog-FieldMask': fields }, body: body?JSON.stringify(body):undefined, signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) });
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
    signal.throwIfAborted(); await this.budget.reserve('route');
    const data = await this.post('https://routes.googleapis.com/directions/v2:computeRoutes', ROUTE_FIELDS, {
      origin: { location: { latLng: { latitude: journey.origin.latitude, longitude: journey.origin.longitude } } },
      destination: { location: { latLng: { latitude: journey.destination.latitude, longitude: journey.destination.longitude } } },
      travelMode: 'DRIVE', computeAlternativeRoutes: true, routingPreference: 'TRAFFIC_AWARE', polylineQuality: 'HIGH_QUALITY', languageCode: 'en-IN', units: 'METRIC',
    }, signal);
    return parseRoutes(data);
  }
  async nearby(query: NearbyQuery, signal: AbortSignal) {
    const cached = this.cache.get(query);
    if (cached) return cached;
    signal.throwIfAborted(); await this.budget.reserve('nearby');
    const data = await this.post('https://places.googleapis.com/v1/places:searchNearby', PLACE_FIELDS, {
      includedTypes: query.partition ? SEARCH_PARTITIONS[query.partition] : [...SEARCH_PARTITIONS.places,...SEARCH_PARTITIONS.help],
      maxResultCount: 20, rankPreference: 'DISTANCE', languageCode: 'en',
      locationRestriction: { circle: { center: query.coordinate, radius: query.radiusMeters } },
    }, signal);
    const result = parseScan(data, query.id, new Date().toISOString());
    this.cache.set(query, result);
    return result;
  }
  async details(id:string,signal:AbortSignal){
    if(!/^[\w-]{1,200}$/.test(id))throw new ServiceError('invalid-input','Invalid place reference.',400);
    const cached=this.detailsCache.get(id);
    if(cached&&Date.now()-cached.at<=10*60_000)return structuredClone(cached.result);
    signal.throwIfAborted();await this.budget.reserve('details');
    const data=await this.post(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`,PLACE_FIELDS.replaceAll('places.',''),undefined,signal);
    if(data.id!==id)throw new ServiceError('invalid-response','Place reference changed.');
    const result=parseScan({places:[data]},`details:${id}`,new Date().toISOString());
    if(this.detailsCache.size>=200)this.detailsCache.delete(this.detailsCache.keys().next().value!);
    this.detailsCache.set(id,{at:Date.now(),result:structuredClone(result)});
    return result;
  }
}
