import type { ActivityAnalysis } from './domain/activity-types';
import { formatMeters } from './ActivityStrip';
import { HELP_CATEGORIES } from './domain/activity';
import {assumedShopHours} from './domain/assumed-hours';
export function helpPoints(a?:ActivityAnalysis){return a?.places.filter(p=>(p.hours.state==='open'||assumedShopHours(p,a.checkedAt)?.open)&&!p.conflict&&p.categories.some(c=>HELP_CATEGORIES.has(c)||c==='drugstore'))??[];}
export function HelpPoints({analysis}:{analysis?:ActivityAnalysis}){
  const points=helpPoints(analysis);
  if(!analysis||!points.length)return null;
  return <section className="help-points"><h3>Help points along this route</h3><p>Open or estimated open when you pass. Check the status below.</p>{analysis.longestObservedHelpGapMeters>0&&<p>Longest gap without a listed open help point (excludes estimates): <strong>{formatMeters(analysis.longestObservedHelpGapMeters)}</strong></p>}
    <ul>{points.map(p=><li key={p.id}><strong>{p.name||p.categories.find(c=>HELP_CATEGORIES.has(c)||c==='drugstore')?.replace('_',' ')}</strong><span>{assumedShopHours(p,analysis.checkedAt)?'Estimated open':p.hours.open24Hours?(p.hours.basis==='regular'?'Usually open 24 hours':'Open 24 hours'):'Listed open'} · About {Math.round(p.arrivalMinutes??0)} min into the journey{p.hours.closingSoon?' · Closing soon':''}</span>{p.coordinate&&<span>{p.coordinate.latitude.toFixed(5)}, {p.coordinate.longitude.toFixed(5)}</span>}</li>)}</ul>
  </section>;
}
