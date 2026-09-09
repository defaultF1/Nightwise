import type { RoadAnalysis } from './domain/roads';
import { formatMeters } from './ActivityStrip';
export function RoadEvidence({analysis}:{analysis?:RoadAnalysis}){
  if(!analysis)return null;
  return <section className="road-evidence" aria-label="Road type evidence"><h3>Road type estimate</h3><dl className="evidence-rows">
    <div><dt>Main-road segments</dt><dd>{formatMeters(analysis.mainMeters)}</dd></div>
    <div><dt>Internal-road segments</dt><dd>{formatMeters(analysis.internalMeters)}</dd></div>
    <div><dt>Unclassified distance</dt><dd>{formatMeters(analysis.unknownMeters)}</dd></div>
    <div><dt>Matched road coverage</dt><dd>{Math.round(analysis.coverage*100)}%</dd></div>
    </dl><p className="settings-helper">Estimated from a North Bengaluru road extract. Parallel roads, bridges and missing matches can remain unknown. This does not establish lighting, road width, access or safety.</p><p className="settings-helper"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors · ODbL</a>{analysis.snapshotDate?` · map snapshot ${analysis.snapshotDate.slice(0,10)}`:''}</p></section>;
}
