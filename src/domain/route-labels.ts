import type { Route } from './types';
import type { Comparison } from './activity-types';

// Display names for returned routes: the fastest keeps its name, the
// highest-scored option is called safest (mapped cameras break near-ties),
// and everything else is an alternative. Without scores the provider labels
// stand, so "safest" is never claimed on missing evidence.
export function labelRoutes<T extends Route>(routes: T[], comparison?: Comparison, cameraCounts: Record<string, number> = {}): T[] {
  if (!comparison || routes.length < 2) return routes;
  const scored = routes.filter(r => comparison.scores[r.id] !== undefined);
  let safest: string | undefined;
  if (scored.length >= 2 && !comparison.estimated && comparison.outcome !== 'insufficient') {
    // Pick one fixed top-score band before the camera tie-break. Pairwise
    // "within three" comparisons are not transitive for three or more routes.
    const highest=Math.max(...scored.map(r=>comparison.scores[r.id]));
    safest = scored.filter(r=>highest-comparison.scores[r.id]<=3).sort((a,b)=>
      (cameraCounts[b.id]??0)-(cameraCounts[a.id]??0)||comparison.scores[b.id]-comparison.scores[a.id]||a.durationSeconds-b.durationSeconds||a.id.localeCompare(b.id))[0].id;
  }
  let alternative = 0;
  return routes.map(r => {
    if (r.id === comparison.fastestId && r.id === safest) return { ...r, label: 'Fastest & safest route' };
    if (r.id === comparison.fastestId) return { ...r, label: 'Fastest route' };
    if (r.id === safest) return { ...r, label: 'Safest route' };
    alternative++; return { ...r, label: `Alternative ${alternative}` };
  });
}
