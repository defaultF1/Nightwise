import type { Coordinate, HoursState } from './types';

export type WeeklyPeriod = { openDay: number; openMinute: number; closeDay: number; closeMinute: number };
export type OpeningHours = { timeZone: string; alwaysOpen?: boolean; periods?: WeeklyPeriod[] };
export type PlaceObservation = { id: string; name?: string; coordinate: Coordinate; categories: string[]; hours?: OpeningHours; calendarHours?: { from: string; until: string; periods: { from: string; until: string }[] }; currentHours?: { openNow: boolean; nextCloseTime?: string; observedAt: string }; observedAt: string };
export type NearbyScan = { queryId: string; observedAt: string; status: 'ok' | 'failed' | 'capped'; places: PlaceObservation[] };
export type RouteSample = { coordinate: Coordinate; distanceMeters: number; queryId: string };
export type NearbyQuery = { id: string; coordinate: Coordinate; radiusMeters: number };
export type QueryPlan = { queries: NearbyQuery[]; samplesByRoute: Record<string, RouteSample[]>; totalSamples: number };
export type HoursEvaluation = { state: HoursState; closingSoon: boolean; minutesUntilClose: number | null };
export type ActivitySegment = { fromMeters: number; toMeters: number; state: 'active' | 'low' | 'unknown' };
export type DeduplicatedPlace = { id: string; name?: string; coordinate?: Coordinate; arrivalMinutes?: number; hours: HoursEvaluation; categories: string[]; sampleIndexes: number[]; conflict: boolean };
export type ActivityAnalysis = {
  routeId: string; source: 'sample' | 'live'; checkedAt: string; distanceMeters: number;
  openPlaces: number | null; closedPlaces: number | null; unknownHours: number | null;
  potentialHelpPoints: number | null; openTransportPoints: number | null; closingSoon: number | null;
  staffedPlaceProxy: number | null;
  longestHelpGapMeters: number | null; longestObservedHelpGapMeters: number;
  lowActivityOpenThreshold: number;
  scanCoverage: number; activityCoverage: number; hoursCoverage: number;
  longestLowActivityMeters: number | null; longestObservedLowActivityMeters: number;
  totalLowActivityMeters: number | null; totalObservedLowActivityMeters: number;
  segments: ActivitySegment[]; places: DeduplicatedPlace[]; limitations: string[];
  coreComparable: boolean;
};
export type Component = 'openDensity' | 'mainRoad' | 'helpDensity' | 'gapContinuity' | 'simplicity' | 'transport';
export type RoadEvidence = { mainRoadFraction?: number; internalRoadFraction?: number; maneuversPerKm?: number; internalTurnsPerKm?:number };
export type Comparison = {
  version: string; fastestId: string | null; selectedId: string | null; recommendedId: string | null;
  outcome: 'empty' | 'single' | 'insufficient' | 'similar' | 'detour' | 'more-activity';
  message: string; commonComponents: Component[]; scores: Record<string,number>;
  componentScores: Record<string, Partial<Record<Component, number>>>;
  rankedIds: string[];
};
