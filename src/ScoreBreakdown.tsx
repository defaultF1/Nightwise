import type { Comparison, Component } from './domain/activity-types';
import { WEIGHTS } from './domain/comparison';

const labels:Record<Component,string>={openDensity:'Open places along the route',mainRoad:'Distance on main roads',helpDensity:'Open help points nearby',gapContinuity:'Fewer gaps between open places',simplicity:'Fewer turns',transport:'Transport locations listed open',cameraCoverage:'Mapped traffic cameras'};

export function ScoreBreakdown({comparison,routeId,sample}:{comparison:Comparison|null;routeId:string;sample:boolean}){
  if(!comparison||comparison.scores[routeId]===undefined)return null;
  const common=comparison.commonComponents;
  const totalWeight=common.reduce((total,key)=>total+WEIGHTS[key],0);
  const values=comparison.componentScores?.[routeId]??{};
  return <section className="score-breakdown" aria-label="Score breakdown">
    <h3>What goes into this score</h3>
    <p className="score-coverage">{`Based on ${common.length} of 7 available checks${sample?' · Tutorial mode':''}`}</p>
    <dl className="evidence-rows">{(Object.keys(WEIGHTS) as Component[]).map(key=>{
      const included=common.includes(key)&&values[key]!==undefined&&totalWeight>0;
      return included?<div key={key}><dt>{labels[key]}{key==='mainRoad'&&<small>About {Math.round(100*values[key]!)}% of the route follows mapped main roads. This does not tell us whether shops are open.</small>}</dt><dd>{`${Math.round(100*WEIGHTS[key]*values[key]!/totalWeight)} / ${Math.round(100*WEIGHTS[key]/totalWeight)} pts`}</dd></div>:null;
    })}</dl>
    <details className="score-method"><summary>How the score works</summary>
      <p>Up to seven signals contribute: open places 21.25, main roads 17, help points 12.75, activity continuity 12.75, fewer turns 12.75, transport 8.5 and mapped cameras 15. Only signals available for every route count, and their weights rescale to a total of 100 — missing evidence is never scored as zero.</p>
      <p>Camera evidence combines cameras per kilometre with their spread across one-kilometre sections. Only complete, route-matched checks less than five minutes old count. Missing camera evidence is excluded for every route. A mapped camera does not confirm recording or monitoring. These weights are a product estimate, not a validated measure of crime risk.</p>
      <p>Potential help listings include petrol pumps, hospitals, police, pharmacies and hotels listed as open. Staffed-place categories describe business types; actual staff presence is not measured, and transport listings do not verify running services.</p>
    </details>
  </section>;
}
