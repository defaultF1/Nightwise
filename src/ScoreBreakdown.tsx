import type { Comparison, Component } from './domain/activity-types';
import { WEIGHTS } from './domain/comparison';

const labels:Record<Component,string>={openDensity:'Open places',mainRoad:'Main-road share',helpDensity:'Help points nearby',gapContinuity:'Activity continuity',simplicity:'Route simplicity',transport:'Open transport'};

export function ScoreBreakdown({comparison,routeId,sample}:{comparison:Comparison|null;routeId:string;sample:boolean}){
  if(!comparison||comparison.scores[routeId]===undefined)return null;
  const common=comparison.commonComponents;
  const totalWeight=common.reduce((total,key)=>total+WEIGHTS[key],0);
  const values=comparison.componentScores?.[routeId]??{};
  return <section className="score-breakdown" aria-label="Score breakdown">
    <h3>What goes into this score</h3>
    <p className="score-coverage">Based on {common.length} of 6 signals · {sample?'Tutorial data':'Live listings'}</p>
    <dl className="evidence-rows">{(Object.keys(WEIGHTS) as Component[]).map(key=>{
      const included=common.includes(key)&&values[key]!==undefined&&totalWeight>0;
      return <div key={key}><dt>{labels[key]}</dt><dd>{included?`${Math.round(100*WEIGHTS[key]*values[key]!/totalWeight)} / ${Math.round(100*WEIGHTS[key]/totalWeight)} pts`:'Not included'}</dd></div>;
    })}</dl>
    <details className="score-method"><summary>How the score works</summary>
      <p>Up to six signals are combined with fixed importance: open places 25, main roads 20, help points 15, activity continuity 15, fewer turns 15, transport 10. Only signals available for every route count, and their weights rescale to a total of 100 — missing evidence is never scored as zero.</p>
      <p>Potential help listings include petrol pumps, hospitals, police, pharmacies and hotels listed as open. Staffed-place categories describe business types; actual staff presence is not measured, and transport listings do not verify running services.</p>
    </details>
  </section>;
}
