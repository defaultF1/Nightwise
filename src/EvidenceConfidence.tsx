import type { ActivityAnalysis } from './domain/activity-types';
import type { RoadAnalysis } from './domain/roads';
export function EvidenceConfidence({analysis:a,road}:{analysis?:ActivityAnalysis;road?:RoadAnalysis}){
  if(!a)return <section className="confidence" aria-label="Evidence confidence"><h3>Evidence confidence <span>Not assessed</span></h3><dl>{['Complete scans','Activity assessed','Known hours'].map(label=><div key={label}><dt>{label}</dt><dd>Unavailable</dd></div>)}<div><dt>Roads matched</dt><dd>{road?`${Math.round(road.coverage*100)}%`:'Not assessed'}</dd></div></dl><p>This response has no shop analysis. Missing evidence does not mean the route has no shops or help points.</p></section>;
  const pct=(v:number)=>`${Math.round(v*100)}%`;
  return <section className="confidence" aria-label="Evidence confidence"><h3>Evidence confidence <span>{a.coreComparable?'Complete activity evidence':'Partial evidence'}</span></h3><dl>
    <div><dt>Complete scans</dt><dd>{pct(a.scanCoverage)}</dd></div><div><dt>Activity assessed</dt><dd>{pct(a.activityCoverage)}</dd></div><div><dt>Known hours</dt><dd>{a.openPlaces===null?'Unknown':pct(a.hoursCoverage)}</dd></div><div><dt>Roads matched</dt><dd>{road?pct(road.coverage):'Not assessed'}</dd></div>
  </dl><p>{a.unknownHours??'Unknown number of'} listings with unknown hours. Evidence coverage is separate from the activity score.</p></section>;
}
