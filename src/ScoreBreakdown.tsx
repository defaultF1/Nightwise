import type { Comparison, Component } from './domain/activity-types';
import { WEIGHTS } from './domain/comparison';

const labels:Record<Component,string>={openDensity:'Open-place density',mainRoad:'Main-road share',helpDensity:'Help and staffed-place evidence',gapContinuity:'Continuity of listed activity',simplicity:'Route simplicity',transport:'Open transport locations'};

export function ScoreBreakdown({comparison,routeId,sample}:{comparison:Comparison|null;routeId:string;sample:boolean}){
  if(!comparison||comparison.scores[routeId]===undefined)return null;
  const common=comparison.commonComponents;
  const totalWeight=common.reduce((total,key)=>total+WEIGHTS[key],0);
  const values=comparison.componentScores?.[routeId]??{};
  const bounds=comparison.componentBounds?.[routeId];
  return <section className="score-breakdown" aria-label="Score breakdown">
    <h3>What goes into this score</h3>
    <p className="score-coverage">{bounds?'6 fixed weights · missing inputs shown as ranges':`${common.length} of 6 signals used`} · {sample?'Activity evidence':'Experimental evidence'}</p>
    <dl className="evidence-rows">{(Object.keys(WEIGHTS) as Component[]).map(key=>{
      const included=common.includes(key)&&values[key]!==undefined&&totalWeight>0;
      return <div key={key}><dt>{labels[key]}</dt><dd>{bounds?`${Math.round(WEIGHTS[key]*bounds[key][0])}–${Math.round(WEIGHTS[key]*bounds[key][1])} / ${WEIGHTS[key]} pts`:included?`${Math.round(100*WEIGHTS[key]*values[key]!/totalWeight)} / ${Math.round(100*WEIGHTS[key]/totalWeight)} pts`:'Not included'}</dd></div>;
    })}</dl>
    <details className="score-method"><summary>How the score works</summary>
      <p>{bounds?'Each row keeps its fixed weight. Missing evidence widens its possible points instead of receiving zero or having its weight redistributed. These are evidence bounds, not statistical confidence intervals. A higher upper number alone is not a reason to choose a route.':'Each row shows its points toward the total. Only signals available for every route contribute. If fewer than six are available, their weights are rescaled; missing evidence is never scored as zero.'}</p>
      <p>The help component combines help density (75%) and open staffed-place category density (25%), then reduces points for long stretches without open help listings. Route simplicity counts turns per kilometre, with an extra penalty for turns estimated to enter internal roads when that evidence is complete for every route. Road matches are estimates; staffed-place categories describe business types and actual staff presence is not measured.</p>
      <p>Potential help listings include petrol pumps, hospitals, police, pharmacies and hotels listed as open. Transport listings do not verify running services or people nearby.</p>
    </details>
  </section>;
}
