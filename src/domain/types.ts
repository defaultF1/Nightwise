export type Coordinate = { latitude: number; longitude: number };
export type TravelMode = 'DRIVE' | 'WALK' | 'TWO_WHEELER';
export type Journey = { origin: string; destination: string; mode: TravelMode };
export type HoursState = 'open' | 'closed' | 'unknown';
export type Route = {
  id: string;
  label: string;
  durationSeconds: number;
  distanceMeters: number;
  path: Coordinate[];
  source: 'sample' | 'google' | 'mappls';
  geometryKind: 'illustrative' | 'offline' | 'provider';
  listedPlaces?: MapplsPlace[];
  turns?: number;
  steps?: { distanceMeters: number; staticDurationSeconds?:number; maneuver?: string; path?:Coordinate[] }[];
};
export type Evidence = {
  openPlaces: number | null;
  potentialHelpPoints: number | null;
  longestLowActivityMeters: number | null;
  coverage: number;
  checkedAt: string;
  source: 'sample' | 'live';
};
export type RouteWithEvidence = Route & { evidence: Evidence };

export type MapplsPlace = { id:string; name:string; address:string; kind:'shop'|'medical'|'hospital'|'fuel'; category:string; alongRouteMeters?:number; openingHours?:string };
