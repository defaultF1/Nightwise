import { useEffect, useReducer } from 'react';
import type { ActivityAnalysis } from './domain/activity-types';
import { CAMERA_FRESHNESS_MS } from './domain/cameras';

// Invalidate the score and pins at evidence expiry even when the user leaves
// the comparison open. This updates local UI only and makes no API requests.
export function useCameraExpiry(analyses: ActivityAnalysis[]): number {
  const [, render] = useReducer(n => n + 1, 0);
  const now = Date.now();
  useEffect(() => {
    const deadlines = analyses.flatMap(a => a.cameras?.status === 'complete' ? [
      Date.parse(a.cameras.checkedAt) + CAMERA_FRESHNESS_MS,
      ...a.cameras.reports.map(r => Date.parse(r.expiresAt ?? '')),
    ] : []).filter(t => Number.isFinite(t) && t > now);
    const timeout = deadlines.length ? setTimeout(render, Math.max(1, Math.min(2_147_483_647, Math.min(...deadlines) - Date.now()))) : undefined;
    document.addEventListener('visibilitychange', render);
    return () => { clearTimeout(timeout); document.removeEventListener('visibilitychange', render); };
  }, [analyses, now]);
  return now;
}
