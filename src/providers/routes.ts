import { AEOS, origins, type TutorialOrigin, type TutorialScenario } from '../data/tutorial';
import type { Coordinate, Route, TravelMode } from '../domain/types';
import { pathLength } from '../domain/geometry';
import { MANYATA_PIN } from '../domain/journey';

export type JourneyRequest = { origin: TutorialOrigin; destinationId: 'aeos'; mode: TravelMode; scenario: TutorialScenario };
export interface RouteProvider { getRoutes(request: JourneyRequest, signal: AbortSignal): Promise<Route[]> }
export class JourneyError extends Error {
  constructor(public code: 'invalid-input' | 'unavailable' | 'invalid-response', message: string, public retryable = false) { super(message); }
}
export function validateJourney(request: JourneyRequest) {
  if (!origins.includes(request.origin) || request.destinationId !== 'aeos' || request.mode !== 'DRIVE') {
    throw new JourneyError('invalid-input', 'Choose a prepared Bengaluru starting point and the AEOS driving journey.');
  }
}
export function validateRoutes(routes: Route[]): Route[] {
  if (routes.length > 4 || new Set(routes.map(r => r.id)).size !== routes.length) throw new JourneyError('invalid-response', 'Route options could not be read.');
  for (const route of routes) {
    if (!route.id || !route.label || !Number.isFinite(route.durationSeconds) || route.durationSeconds <= 0 || !Number.isFinite(route.distanceMeters) || route.distanceMeters <= 0 || route.distanceMeters > 100_000 || route.path.length > 4000) throw new JourneyError('invalid-response', 'A route is outside this preview’s limits.');
    const length = pathLength(route.path);
    if (length < 1 || length > 100_000) throw new JourneyError('invalid-response', 'Route geometry is outside this preview’s limits.');
  }
  return routes;
}
export function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Cancelled', 'AbortError')); return; }
    const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    signal.addEventListener('abort', abort, { once: true });
  });
}

// Fictional offsets for diagram/testing, not roads or verified starting gates.
function illustrativePoint(east: number, north: number): Coordinate {
  return { latitude: AEOS.latitude + north / 111_195, longitude: AEOS.longitude + east / (111_195 * Math.cos(AEOS.latitude * Math.PI / 180)) };
}
export function sampleRouteOptions(origin: TutorialOrigin, scenario: TutorialScenario): Route[] {
  if (scenario === 'none') return [];
  const scale = origin === 'Sahakar Nagar' ? 0.36 : 1;
  const paths = [
    [[4500,500],[3400,700],[2200,-650],[950,-650],[0,0]],
    [[4500,500],[3400,700],[2200,1600],[700,1600],[0,0]],
    [[4500,500],[4000,-1400],[1700,-1800],[0,0]],
  ];
  const durations = origin === 'Sahakar Nagar' ? [6,9,11] : [18,22,26];
  if(scenario==='detour')durations[1]=durations[0]+15;
  const count = scenario === 'one' ? 1 : scenario === 'three' ? 3 : 2;
  return paths.slice(0,count).map((offsets,index) => {
    let path = offsets.map(([east,north]) => illustrativePoint(east * scale, north * scale));
    if (origin === 'AEOS') {
      path = path.reverse();
      path[0] = { latitude: AEOS.latitude, longitude: AEOS.longitude };
      path[path.length - 1] = { latitude: MANYATA_PIN.latitude, longitude: MANYATA_PIN.longitude };
    }
    return { id: `sample:${origin}:${index}`, label: index === 0 ? 'Fastest' : `Alternative ${index}`, durationSeconds: durations[index] * 60, distanceMeters: pathLength(path), path, source:'sample', geometryKind:'illustrative' };
  });
}
export function createSampleRouteProvider(delayMs = 450): RouteProvider {
  return { async getRoutes(request, signal) {
    validateJourney(request);
    await abortableDelay(delayMs,signal);
    if (request.scenario === 'error') throw new JourneyError('unavailable', 'The tutorial is simulating a connection problem.', true);
    return validateRoutes(sampleRouteOptions(request.origin,request.scenario));
  } };
}
