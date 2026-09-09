import type { Route } from './types';
import type { NearbyScan, RoadEvidence } from './activity-types';
import { buildQueryPlan, analyzeRoute } from './activity';
import { compareActivity } from './comparison';

export function analyzeComparison(routes:Route[],getScans:(plan:ReturnType<typeof buildQueryPlan>)=>NearbyScan[],checkedAt:string,roads:Record<string,RoadEvidence>={}){
  const plan=buildQueryPlan(routes);
  const scans=getScans(plan);
  const analyses=routes.map(route=>analyzeRoute(route,plan,scans,checkedAt));
  return {plan,analyses,comparison:compareActivity(routes,analyses,roads)};
}
