import type { ActivityAnalysis } from './domain/activity-types';
import type { RoadAnalysis } from './domain/roads';
export function EvidenceConfidence({analysis:a,road}:{analysis?:ActivityAnalysis;road?:RoadAnalysis}){
  const pct=(v:number)=>`${Math.min(100,Math.max(0,Math.floor(v*100+1e-7)))}%`;
  return <section className="confidence" aria-label="Evidence confidence"><h3>How much do we know? <span>{a?.coreComparable?'Listing coverage complete':a?'Some information is missing':'Not checked yet'}</span></h3>
    <p className="confidence-summary">{a?<>Usable activity information for <strong>{pct(a.activityCoverage)} of this route</strong>. {a.activityCoverage<1?'The rest stays unknown, not low activity.':'This describes the returned listings, not everything happening on the street.'}</>:<>This response has no shop analysis. Missing evidence does not mean the route has no shops or help points.</>}</p>
    <details className="coverage-details"><summary>See what was checked</summary><dl><div><dt>Complete searches</dt><dd>{a?pct(a.scanCoverage):'Unavailable'}</dd></div><div><dt>Activity assessed</dt><dd>{a?pct(a.activityCoverage):'Unavailable'}</dd></div><div><dt>Known hours</dt><dd>{a?.openPlaces!=null?pct(a.hoursCoverage):'Unknown'}</dd></div><div><dt>Roads matched</dt><dd>{road?pct(road.coverage):'Not assessed'}</dd></div></dl><p>Complete searches: route distance checked without a result cap or search failure. Known hours: share of returned listings with usable hours. Roads matched: distance identified in our road data. These measure information coverage, not safety.</p></details>
  </section>;
}
