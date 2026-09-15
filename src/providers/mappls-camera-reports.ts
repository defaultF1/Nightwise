import type { Route } from '../domain/types';
import { locateCamera, type CameraReport, type RouteCameraEvidence } from '../domain/cameras';
import { validCoordinate } from '../domain/geometry';

type ReportOptions = {
  routeId: string; routeIndex: number; checkedAt: string;
  /** Populate only with category IDs confirmed by Mappls for this account. */
  cameraCategories: ReadonlyMap<number, CameraReport['kind']>;
  expiryUnit: 'seconds' | 'milliseconds';
};
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

// Boundary for the documented Mappls Route Report Summary response. This does
// not issue requests: SDK access, routeId support and camera category IDs still
// need confirmation. A map camera-control API or speed breaker is not CCTV data.
export function parseMapplsCameraReports(route: Route, payload: unknown, options: ReportOptions): RouteCameraEvidence {
  const result: RouteCameraEvidence = { routeId:route.id, provider:'mappls', checkedAt:options.checkedAt, path:route.path, status:'unavailable', reports:[] };
  if (!options.routeId || !Number.isInteger(options.routeIndex) || options.routeIndex < 0 || !options.cameraCategories.size || !Number.isFinite(Date.parse(options.checkedAt))) return result;
  if (!object(payload) || !Array.isArray(payload.routes)) return result;
  const matches = payload.routes.filter(r => object(r) && r.routeId === options.routeId && r.index === options.routeIndex);
  if (matches.length !== 1 || !object(matches[0]) || !Array.isArray(matches[0].reportDetails)) return result;
  result.status = 'complete';
  for (const row of matches[0].reportDetails) {
    if (!object(row) || typeof row.childCategoryId !== 'number') { result.status = 'partial'; continue; }
    const kind = options.cameraCategories.get(row.childCategoryId);
    if (!kind) continue;
    if (row.status === 'Unpublished') continue;
    if (row.status !== 'Published' || typeof row.id !== 'string' || !row.id || typeof row.latitude !== 'number' || typeof row.longitude !== 'number') { result.status = 'partial'; continue; }
    const coordinate = { latitude:row.latitude, longitude:row.longitude };
    if (!validCoordinate(coordinate)) { result.status = 'partial'; continue; }
    const alongRouteMeters = locateCamera(route, coordinate);
    if (alongRouteMeters === undefined) { result.status = 'partial'; continue; }
    let expiresAt: string | undefined;
    if (row.expiry !== undefined && row.expiry !== null) {
      const expiry = typeof row.expiry === 'number' ? row.expiry * (options.expiryUnit === 'seconds' ? 1000 : 1) : NaN;
      if (!Number.isFinite(expiry) || expiry <= 0 || expiry > 8.64e15) { result.status = 'partial'; continue; }
      expiresAt = new Date(expiry).toISOString();
    }
    result.reports.push({ id:row.id, coordinate, kind, alongRouteMeters, ...(expiresAt?{expiresAt}:{}) });
  }
  return result;
}
