import type { Comparison, Component } from './domain/activity-types';
import { WEIGHTS } from './domain/comparison';

const labels:Record<Component,string>={openDensity:'Open-place density',mainRoad:'Main-road share',helpDensity:'Potential help-point density',gapContinuity:'Continuity of listed activity',simplicity:'Route simplicity',transport:'Open transport locations'};

export function ScoreBreakdown({comparison,routeId,sample}:{comparison:Comparison|null;routeId:string;sample:boolean}){
  if(!comparison||comparison.scores[routeId]===undefined)return null;
  const common=comparison.commonComponents;
  const totalWeight=common.reduce((total,key)=>total+WEIGHTS[key],0);
  const values=comparison.componentScores?.[routeId]??{};
  return <section className="score-breakdown" aria-label="Score breakdown">
    <h3>What goes into this score</h3>
    <p className="score-coverage">{common.length} of 6 signals used · {sample?'Sample evidence':'Experimental evidence'}</p>
    <dl className="evidence-rows">{(Object.keys(WEIGHTS) as Component[]).map(key=>{
      const included=common.includes(key)&&values[key]!==undefined&&totalWeight>0;
      return <div key={key}><dt>{labels[key]}</dt><dd>{included?`${(100*WEIGHTS[key]*values[key]!/totalWeight).toFixed(1)} / ${(100*WEIGHTS[key]/totalWeight).toFixed(1)} pts`:'Not included'}</dd></div>;
    })}</dl>
    <p className="settings-helper">Each row shows its points toward the total. Only signals available for every route contribute. If fewer than six are available, their weights are rescaled; missing evidence is never scored as zero.</p>
    {sample&&<p className="settings-helper">All tutorial evidence is illustrative. Road shares and turn rates are invented examples, not measurements of these Bengaluru streets.</p>}
    <p className="settings-helper">Potential help listings include petrol pumps, hospitals, police, pharmacies and hotels listed as open. Transport listings do not verify running services or people nearby.</p>
  </section>;
}
