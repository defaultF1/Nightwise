import type { ActivityAnalysis } from './domain/activity-types';
import { formatMeters } from './ActivityStrip';
export function helpPoints(a?:ActivityAnalysis){return a?.places.filter(p=>p.hours.state==='open'&&!p.conflict&&p.categories.some(c=>['pharmacy','hospital','gas_station'].includes(c)))??[];}
export function HelpPoints({analysis}:{analysis?:ActivityAnalysis}){
  if(!analysis)return <section className="help-points"><h3>Help points along this route</h3><p>Unavailable in this response. Nearby pharmacy, hospital and petrol-pump opening hours have not been assessed.</p><p>Longest gap without a listed open help point: <strong>Unknown</strong></p></section>;
  const points=helpPoints(analysis);
  return <section className="help-points"><h3>Help points along this route</h3><p>Listed as open around the estimated passing time. Opening schedules do not confirm assistance or access.</p><p>Longest gap without a listed open help point: <strong>{formatMeters(analysis.longestHelpGapMeters)}</strong></p>
    {!points.length?<p>No open pharmacy, petrol pump or hospital was identified in the available evidence.</p>:<ul>{points.map(p=><li key={p.id}><strong>{p.name||p.categories.find(c=>['pharmacy','hospital','gas_station'].includes(c))?.replace('_',' ')}</strong><span>About {Math.round(p.arrivalMinutes??0)} min into the journey{p.hours.closingSoon?' · Closing soon':''}</span>{p.coordinate&&<span>{p.coordinate.latitude.toFixed(5)}, {p.coordinate.longitude.toFixed(5)}</span>}</li>)}</ul>}
  </section>;
}
