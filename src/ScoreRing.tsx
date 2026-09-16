import type {CSSProperties} from 'react';
export function ScoreRing({score,label}:{score:number;label:string;signals?:number}){
 const value=Math.round(Math.max(0,Math.min(100,score)));
 return <span className="score-display" aria-label={`${label}: ${value} out of 100.`}>
  <span className="score-ring" style={{'--score-offset':100-value} as CSSProperties} aria-hidden="true">
   <svg viewBox="0 0 80 80"><circle className="score-track" cx="40" cy="40" r="34"/><circle className="score-progress" cx="40" cy="40" r="34" pathLength="100"/></svg>
   <span><b>{value}</b><small>/ 100</small></span>
  </span><span className="score-caption">{label}<small>Route activity estimate</small></span>
 </span>;
}
