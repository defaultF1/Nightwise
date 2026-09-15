import type { Coordinate, Route } from './types';
import { distanceMeters, validCoordinate, pathLength } from './geometry';

export const CAMERA_FRESHNESS_MS = 5 * 60_000;
export type CameraReport = {
  id: string; coordinate: Coordinate; kind: 'traffic-camera' | 'speed-camera';
  /** Distance along the matched provider route, not straight-line distance from the origin. */
  alongRouteMeters: number; expiresAt?: string;
};
export type RouteCameraEvidence = {
  routeId: string; provider: 'mappls'; checkedAt: string;
  status: 'complete' | 'partial' | 'unavailable';
  /** Geometry binds reports to the exact route, including when route IDs are reused. */
  path: Coordinate[]; reports: CameraReport[];
};
export type CameraSummary = { count: number; perKm: number; spread: number; value: number; reports: CameraReport[] };

export function locateCamera(route: Route, point: Coordinate): number | undefined {
  if (!validCoordinate(point) || route.path.length < 2 || route.path.some(p => !validCoordinate(p))) return;
  let traversed = 0, closest = Infinity, along = 0;
  const scale = 111195 * Math.cos(point.latitude * Math.PI / 180);
  for (let i = 1; i < route.path.length; i++) {
    const a = route.path[i - 1], b = route.path[i];
    const ax = (a.longitude - point.longitude) * scale, ay = (a.latitude - point.latitude) * 111195;
    const dx = (b.longitude - a.longitude) * scale, dy = (b.latitude - a.latitude) * 111195;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    const offset = Math.hypot(ax + t * dx, ay + t * dy), length = distanceMeters(a, b);
    if (offset < closest) { closest = offset; along = traversed + t * length; }
    traversed += length;
  }
  // Proximity is only a sanity check. The adapter must also require the
  // provider's route association; nearby parallel roads must not be inferred.
  return closest <= 40 && traversed > 0 ? along / traversed * route.distanceMeters : undefined;
}

// A complete response means the provider completed its query, not that every
// physical camera has been inventoried or that any camera is working.
export function summarizeCameras(route: Route, evidence?: RouteCameraEvidence, now = Date.now()): CameraSummary | undefined {
  if (!evidence || evidence.provider !== 'mappls' || evidence.status !== 'complete' || evidence.routeId !== route.id) return;
  const checked = Date.parse(evidence.checkedAt);
  if (!Number.isFinite(now) || !Number.isFinite(checked) || checked > now || now - checked >= CAMERA_FRESHNESS_MS) return;
  if (!Number.isFinite(route.distanceMeters) || route.distanceMeters <= 0 || route.path.length < 2) return;
  if (!Array.isArray(evidence.path) || evidence.path.length !== route.path.length || evidence.path.some((p, i) => !p || !validCoordinate(p) || !validCoordinate(route.path[i]) || distanceMeters(p, route.path[i]) > 1)) return;
  if (!Array.isArray(evidence.reports) || pathLength(route.path) <= 0) return;
  const reports: CameraReport[] = [];
  const ids = new Set<string>();
  for (const report of evidence.reports) {
    // Reject malformed evidence instead of converting an unreadable response to zero cameras.
    if (!report || typeof report.id !== 'string' || !report.id || !report.coordinate || !validCoordinate(report.coordinate)
      || !['traffic-camera', 'speed-camera'].includes(report.kind) || !Number.isFinite(report.alongRouteMeters)
      || report.alongRouteMeters < 0 || report.alongRouteMeters > route.distanceMeters) return;
    if (report.expiresAt !== undefined && !Number.isFinite(Date.parse(report.expiresAt))) return;
    if (report.expiresAt && Date.parse(report.expiresAt) <= now) continue;
    const located = locateCamera(route, report.coordinate);
    if (located === undefined || Math.abs(located - report.alongRouteMeters) > 100) return;
    if (ids.has(report.id)) continue;
    ids.add(report.id);
    // Reports at the same physical location cannot multiply the score.
    if (reports.some(p => distanceMeters(p.coordinate, report.coordinate) < 20)) continue;
    reports.push(report);
  }
  const km = route.distanceMeters / 1000;
  const bins = Math.max(1, Math.ceil(km));
  const occupied = new Set(reports.map(r => Math.min(bins - 1, Math.floor(r.alongRouteMeters / 1000))));
  const perKm = reports.length / km, spread = occupied.size / bins;
  // Product heuristic: full density at two mapped cameras/km, moderated by
  // spread across 1 km sections. These thresholds are not validated crime-risk measures.
  return { count: reports.length, perKm, spread, value: .5 * Math.min(1, perKm / 2) + .5 * spread, reports };
}
