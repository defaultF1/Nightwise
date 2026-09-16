import type { Route } from './types';
import type { Comparison } from './activity-types';

// Display names for returned routes: the fastest keeps its name, the
// highest-scored option is called safest (cameras are already in the score),
// and everything else is an alternative. Without scores the provider labels
// stand, so "safest" is never claimed on missing evidence.
export function labelRoutes<T extends Route>(routes: T[], comparison?: Comparison): T[] {
  if (!comparison || routes.length < 2) return routes;
  const scored = routes.filter(r => comparison.scores[r.id] !== undefined);
  let safest: string | undefined;
  if (scored.length >= 2 && !comparison.estimated && comparison.outcome !== 'insufficient') {
    safest = [...scored].sort((a,b)=>comparison.scores[b.id]-comparison.scores[a.id]||a.durationSeconds-b.durationSeconds||a.id.localeCompare(b.id))[0].id;
  }
  let alternative = 0;
  return routes.map(r => {
    if (r.id === comparison.fastestId && r.id === safest) return { ...r, label: 'Fastest & safest route' };
    if (r.id === comparison.fastestId) return { ...r, label: 'Fastest route' };
    if (r.id === safest) return { ...r, label: 'Safest route' };
    alternative++; return { ...r, label: `Alternative ${alternative}` };
  });
}
