import type { Route } from './types';
import type { ActivityAnalysis, Comparison } from './activity-types';
import type { RoadAnalysis } from './roads';
export type LiveResult = {
  requestUsage?: {routeCalls:number;nearbyCalls:number;detailsCalls:number;scope:string};
  routes: Route[]; analyses: ActivityAnalysis[]; comparison: Comparison;
  roadAnalyses?: Record<string,RoadAnalysis>;
  checkedAt: string; activityStatus: 'complete' | 'partial' | 'disabled' | 'budget';
  notices: string[]; attributions: { name: string; uri?: string }[];
  usage: { routeCalls: number; nearbyCalls: number; routeLimit: number; nearbyLimit: number; remainingComparisons: number };
};
export type ServiceStatus = { ready: boolean; configured?:boolean; paused?:boolean; searchEnabled?:boolean; searchPreviewEnabled?:boolean; activityEnabled: boolean; scoringEnabled: boolean; accessCodeRequired: boolean; maxQueries: number };
