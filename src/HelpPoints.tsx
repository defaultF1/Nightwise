import type { ActivityAnalysis } from './domain/activity-types';
import { formatMeters } from './ActivityStrip';
import { HELP_CATEGORIES } from './domain/activity';
export function helpPoints(a?:ActivityAnalysis){return a?.places.filter(p=>p.hours.state==='open'&&!p.conflict&&p.categories.some(c=>HELP_CATEGORIES.has(c)))??[];}
export function HelpPoints({analysis}:{analysis?:ActivityAnalysis}){
  const points=helpPoints(analysis);
  if(!analysis||!points.length)return null;
  return <section className="help-points"><h3>Help points along this route</h3><p>Listed as open around the estimated passing time.</p>{analysis.longestObservedHelpGapMeters>0&&<p>Longest gap without a listed open help point: <strong>{formatMeters(analysis.longestObservedHelpGapMeters)}</strong></p>}
    <ul>{points.map(p=><li key={p.id}><strong>{p.name||p.categories.find(c=>HELP_CATEGORIES.has(c))?.replace('_',' ')}</strong><span>About {Math.round(p.arrivalMinutes??0)} min into the journey{p.hours.closingSoon?' · Closing soon':''}</span>{p.coordinate&&<span>{p.coordinate.latitude.toFixed(5)}, {p.coordinate.longitude.toFixed(5)}</span>}</li>)}</ul>
  </section>;
}
