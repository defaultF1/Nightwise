import type { Comparison, Component } from './domain/activity-types';
import { WEIGHTS } from './domain/comparison';

const labels:Record<Component,string>={openDensity:'Open places along the route',mainRoad:'Distance on main roads',helpDensity:'Open help points nearby',gapContinuity:'Fewer gaps between open places',simplicity:'Fewer turns',transport:'Transport locations listed open'};

export function ScoreBreakdown({comparison,routeId,sample}:{comparison:Comparison|null;routeId:string;sample:boolean}){
  if(!comparison||comparison.scores[routeId]===undefined)return null;
  const common=comparison.commonComponents;
  const weights=comparison.weights??WEIGHTS;
  const values=comparison.componentScores?.[routeId]??{};
  return <section className="score-breakdown" aria-label="Score breakdown">
    <h3>What goes into this score</h3>
    <p className="score-coverage">{sample?'Tutorial activity estimate.':'Route activity estimate.'} Each factor has a fixed point limit.</p>
    <dl className="evidence-rows">{(Object.keys(WEIGHTS) as Component[]).map(key=>{
      const included=common.includes(key)&&values[key]!==undefined&&weights[key]>0;
      return included?<div key={key}><dt>{labels[key]}{key==='mainRoad'&&<small>About {Math.round(100*values[key]!)}% of the route follows mapped main roads.</small>}</dt><dd>{`${(weights[key]*values[key]!).toFixed(1)} / ${weights[key]} pts`}</dd></div>:null;
    })}</dl>
    <details className="score-method"><summary>How the score works</summary>
      <p>Points add up within fixed limits: open places {weights.openDensity}, main roads {weights.mainRoad}, help points {weights.helpDensity}, activity continuity {weights.gapContinuity}, fewer turns {weights.simplicity}, transport {weights.transport}. Walking gives more weight to activity spread and help points. One factor can never fill the whole score.</p>
      <p>Place counts are adjusted for route length and use a gradual scale. Supplied opening schedules carry full credit; typical opening-time estimates carry 35% credit. Activity spread measures support along the route, so a cluster of shops cannot stand in for the whole journey. The score describes supported activity evidence, not a percentage chance of safety.</p>
      {comparison.estimated&&<p>Typical hours used for planning are shops 9 am–8 pm, pharmacies 10 am–11 pm and fuel stations 24 hours (IST). Hospitals receive no default hours. Only supplied open schedules contribute to help and transport availability.</p>}
      <p>Potential help listings include petrol pumps, hospitals, police, pharmacies and hotels listed as open. Staffed-place categories describe business types; actual staff presence is not measured, and transport listings do not verify running services.</p>
    </details>
  </section>;
}
