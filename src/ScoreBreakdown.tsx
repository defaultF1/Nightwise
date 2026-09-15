import type { Comparison, Component } from './domain/activity-types';
import { WEIGHTS } from './domain/comparison';

const labels:Record<Component,string>={openDensity:'Open places along the route',mainRoad:'Distance on main roads',helpDensity:'Open help points nearby',gapContinuity:'Fewer gaps between open places',simplicity:'Fewer turns',transport:'Transport locations listed open'};

export function ScoreBreakdown({comparison,routeId,sample}:{comparison:Comparison|null;routeId:string;sample:boolean}){
  if(!comparison||comparison.scores[routeId]===undefined)return null;
  const common=comparison.commonComponents;
  const totalWeight=common.reduce((total,key)=>total+WEIGHTS[key],0);
  const values=comparison.componentScores?.[routeId]??{};
  return <section className="score-breakdown" aria-label="Score breakdown">
    <h3>What goes into this score</h3>
    {comparison.estimated&&<p className="score-coverage">Planning estimate. Listed hours take priority. When hours are missing: shops use 9 am–8 pm, pharmacies 10 am–11 pm, and petrol pumps 24 hours (IST). Hospitals and clinics receive no default hours. Unverified help availability, activity gaps and transport are left out.</p>}
    <p className="score-coverage">{common.includes('openDensity')?`Based on ${common.length} of 6 available checks${sample?' · Tutorial mode':''}`:'Road information only — open-shop activity could not be compared.'}</p>
    <dl className="evidence-rows">{(Object.keys(WEIGHTS) as Component[]).map(key=>{
      const included=common.includes(key)&&values[key]!==undefined&&totalWeight>0;
      return included?<div key={key}><dt>{labels[key]}{key==='mainRoad'&&<small>About {Math.round(100*values[key]!)}% of the route follows mapped main roads. This does not tell us whether shops are open.</small>}</dt><dd>{`${Math.round(100*WEIGHTS[key]*values[key]!/totalWeight)} / ${Math.round(100*WEIGHTS[key]/totalWeight)} pts`}</dd></div>:null;
    })}</dl>
    <details className="score-method"><summary>How the score works</summary>
      <p>Up to six signals are combined with fixed importance: open places 25, main roads 20, help points 15, activity continuity 15, fewer turns 15, transport 10. Only signals available for every route count, and their weights rescale to a total of 100 — missing evidence is never scored as zero.</p>
      <p>Potential help listings include petrol pumps, hospitals, police, pharmacies and hotels listed as open. Staffed-place categories describe business types; actual staff presence is not measured, and transport listings do not verify running services.</p>
    </details>
  </section>;
}
