import type { ActivityAnalysis } from './domain/activity-types';

export function formatMeters(value:number|null):string{
  if(value===null||!Number.isFinite(value))return 'Not assessed';if(value===0)return 'None observed';
  return value>=1000?`~${(value/1000).toFixed(1)} km`:`~${Math.max(1,Math.round(value/50)*50)} m`;
}
export function ActivityStrip({analysis}:{analysis:ActivityAnalysis}){
  const known=analysis.activityCoverage*100;
  return <div className="activity-strip">
    <div className="strip-title"><strong>Along this {analysis.source==='sample'?'sample ':''}route</strong><span>{Math.round(known)}% assessed</span></div>
    <div className="segment-band" role="img" aria-label={`${Math.round(known)} percent of the ${analysis.source==='sample'?'sample ':''}route has usable activity evidence. ${Math.round(100-known)} percent is unknown.`}>
      {analysis.segments.map((segment,i)=><span key={i} className={`segment ${segment.state}`} style={{width:`${(segment.toMeters-segment.fromMeters)/analysis.distanceMeters*100}%`}} title={`${Math.round(segment.fromMeters)}–${Math.round(segment.toMeters)} m: ${segment.state==='active'?'At least two open listings observed':segment.state==='low'?'Fewer than two confirmed-open listings':'Unknown evidence'}`}/>)}
    </div>
    <div className="segment-legend"><span><i className="active"/> More listed activity</span><span><i className="low"/> Low observed</span><span><i className="unknown"/> Unknown</span></div>
  </div>;
}
