import type { RoadAnalysis } from './domain/roads';
import { formatMeters } from './ActivityStrip';
export function RoadEvidence({analysis}:{analysis?:RoadAnalysis}){
  if(!analysis)return null;
  const reasons:Record<string,string>={'no-candidate':'No mapped road nearby',alignment:'Road direction differs',grade:'Bridge or elevation unresolved',parallel:'Parallel roads ambiguous',unsupported:'Unclassified road type'};
  return <section className="road-evidence" aria-label="Road type evidence"><h3>Road type estimate</h3><dl className="evidence-rows">
    <div><dt>Main-road segments</dt><dd>{formatMeters(analysis.mainMeters)}</dd></div>
    <div><dt>Internal-road segments</dt><dd>{formatMeters(analysis.internalMeters)}</dd></div>
    <div><dt>Unclassified distance</dt><dd>{formatMeters(analysis.unknownMeters)}</dd></div>
    {Object.entries(analysis.unknownReasons??{}).filter(([,meters])=>meters>0).map(([reason,meters])=><div key={reason}><dt>{reasons[reason]??reason}</dt><dd>{formatMeters(meters)}</dd></div>)}
    <div><dt>Estimated turns onto internal roads</dt><dd>{analysis.internalTurns??'Not assessed'}</dd></div><div><dt>Turns with unknown road type</dt><dd>{analysis.unknownTurns??'Not assessed'}</dd></div><div><dt>Matched road coverage</dt><dd>{Math.round(analysis.coverage*100)}%</dd></div>
    </dl><p className="settings-helper">Estimated from a road extract for the selected city. Parallel roads, bridges and missing matches can remain unknown. This does not establish lighting, road width, access or safety.</p><p className="settings-helper"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors · ODbL</a>{analysis.snapshotDate?` · map snapshot ${analysis.snapshotDate.slice(0,10)}`:''}</p></section>;
}
