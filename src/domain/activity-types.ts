import type { Coordinate, HoursState } from './types';

export type WeeklyPeriod = { openDay: number; openMinute: number; closeDay: number; closeMinute: number };
export type OpeningHours = { timeZone: string; alwaysOpen?: boolean; alwaysClosed?: boolean; periods?: WeeklyPeriod[] };
export type PlaceSchedule = { currentWeek: string[]; regularWeek: string[]; specialDates: string[]; nextOpenTime?: string; nextCloseTime?: string };
export type PlaceObservation = { id: string; provider?: 'geoapify'; name?: string; coordinate: Coordinate; categories: string[]; hours?: OpeningHours; hoursOrigin?: 'google-regular'; businessStatus?: string; schedule?: PlaceSchedule; currentScheduleInvalid?: boolean; calendarHours?: { regular?: boolean; alwaysOpen?: boolean; from: string; until: string; periods: { from: string; until: string }[] }; currentHours?: { openNow: boolean; nextOpenTime?: string; nextCloseTime?: string; observedAt: string }; observedAt: string };
export type NearbyScan = { queryId: string; observedAt: string; status: 'ok' | 'failed' | 'capped'; places: PlaceObservation[] };
export type RouteSample = { coordinate: Coordinate; distanceMeters: number; queryId: string };
export type NearbyQuery = { id: string; coordinate: Coordinate; radiusMeters: number; partition?: 'places' | 'help' };
export type QueryPlan = { queries: NearbyQuery[]; samplesByRoute: Record<string, RouteSample[]>; totalSamples: number };
export type HoursEvaluation = { open24Hours?: boolean; state: HoursState; closingSoon: boolean; minutesUntilClose: number | null; basis?: 'current' | 'regular' | 'business-status'; reason?: string };
export type ActivitySegment = { fromMeters: number; toMeters: number; state: 'active' | 'low' | 'unknown' };
export type DeduplicatedPlace = { id: string; name?: string; coordinate?: Coordinate; arrivalMinutes?: number; hours: HoursEvaluation; schedule?: PlaceSchedule; categories: string[]; sampleIndexes: number[]; conflict: boolean };
export type ActivityAnalysis = {
  lowActivityGapBounds?: [number, number]; helpGapBounds?: [number, number];
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
export type RoadEvidence = { mainRoadFraction?: number; internalRoadFraction?: number; maneuversPerKm?: number; internalTurnsPerKm?:number; mainMeters?:number; internalMeters?:number; unknownMeters?:number };
export type Comparison = {
  version: string; fastestId: string | null; selectedId: string | null; recommendedId: string | null;
  outcome: 'empty' | 'single' | 'insufficient' | 'similar' | 'detour' | 'more-activity';
  message: string; commonComponents: Component[]; scores: Record<string,number>;
  componentScores: Record<string, Partial<Record<Component, number>>>;
  rankedIds: string[];
};
