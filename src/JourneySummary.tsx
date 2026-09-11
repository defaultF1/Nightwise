import type { ActivityAnalysis, Comparison } from './domain/activity-types';
import type { Route } from './domain/types';
import { formatMeters } from './ActivityStrip';

export function JourneySummary({routes,comparison,analyses,onSelect}:{routes:Route[];comparison:Comparison|null;analyses:ActivityAnalysis[];onSelect:(id:string)=>void}){
  if(!routes.length||!comparison)return null;
  const choice=routes.find(r=>r.id===(comparison.recommendedId??comparison.fastestId))??routes[0];
  const a=analyses.find(a=>a.routeId===choice.id);
  return <section className="journey-answer evidence-notice" data-outcome={comparison.outcome} aria-label="Journey recommendation">
    <span className="small-label">{comparison.recommendedId?'RECOMMENDED FOR LISTED ACTIVITY':'QUICKEST OPTION'}</span>
    <h2>{choice.label} · {Math.round(choice.durationSeconds/60)} min <span>· {(choice.distanceMeters/1000).toFixed(1)} km</span></h2>
    <p>{comparison.message}</p>
    {a&&a.openPlaces!==null&&<ul><li>{`${a.openPlaces} places listed as open around your passing time`}</li>{a.potentialHelpPoints!==null&&<li>{`${a.potentialHelpPoints} listed open help points · longest gap ${formatMeters(a.longestObservedHelpGapMeters)}`}</li>}</ul>}
    <button className="secondary-button" onClick={()=>onSelect(choice.id)}>Select {choice.label.toLowerCase()}</button>
  </section>;
}
