import type { Coordinate, Route } from '../domain/types';
import type { RouteCameraEvidence } from '../domain/cameras';
import { summarizeCameras } from '../domain/cameras';

export const CAMERA_COLOR = '#22d3ee';
export type CameraPin = Coordinate & { name: string; status: string };
export function cameraPins(route: Route, evidence?: RouteCameraEvidence, now = Date.now()): CameraPin[] {
  return summarizeCameras(route, evidence, now)?.reports.map(report => ({
    ...report.coordinate,
    name: report.kind === 'speed-camera' ? 'Mapped speed camera' : 'Mapped traffic camera',
    status: 'Mappls camera report. Recording and monitoring are not confirmed.',
  })) ?? [];
}
