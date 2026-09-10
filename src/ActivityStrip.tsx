import type { ActivityAnalysis } from './domain/activity-types';

export function formatMeters(value:number|null):string{
  if(value===null||!Number.isFinite(value))return 'Not assessed';if(value===0)return 'None observed';
  return value>=1000?`~${(value/1000).toFixed(1)} km`:`~${Math.max(1,Math.round(value/50)*50)} m`;
}
export function formatGap(bounds:[number,number]|undefined,fallback:number|null):string{
  if(!bounds)return formatMeters(fallback);
  if(Math.abs(bounds[1]-bounds[0])<1)return formatMeters(bounds[0]);
  return `${formatMeters(bounds[0])} to ${formatMeters(bounds[1])} · uncertain`;
}
export function ActivityStrip({analysis}:{analysis:ActivityAnalysis}){
  const known=Math.min(100,Math.max(0,Math.floor(analysis.activityCoverage*100+1e-7)));
  return <div className="activity-strip">
    <div className="strip-title"><strong>Open places along the way</strong><span>{known}% checked for activity</span></div>
    <p className="strip-explanation">{known===100?'We have usable listing information along this whole route.':`Enough information for ${known}% of this route; ${100-known}% is still unknown.`} This is data coverage, not a safety rating.</p>
    <div className="strip-direction"><span>Start</span><span>Destination</span></div>
    <div className="segment-band" role="img" aria-label={`${known} percent of the route has usable activity evidence. ${100-known} percent is unknown. Read from start on the left to destination on the right.`}>
      {analysis.segments.map((segment,i)=><span key={i} className={`segment ${segment.state}`} style={{width:`${(segment.toMeters-segment.fromMeters)/analysis.distanceMeters*100}%`}} title={`${Math.round(segment.fromMeters)}–${Math.round(segment.toMeters)} m: ${segment.state==='active'?'At least two open listings observed':segment.state==='low'?'Fewer than two confirmed-open listings':'Unknown evidence'}`}/>)}
    </div>
    <div className="segment-legend"><span><i className="active"/> Open places</span><span><i className="low"/> Few open places</span><span><i className="unknown"/> Not enough data</span></div>
    <details className="strip-help"><summary>How does this help me choose?</summary><p>The line follows your journey from left to right. Longer sections represent more distance.</p><ul><li><strong>Solid — open places:</strong> nearby samples include at least two places listed as open when you pass.</li><li><strong>Stripes — few open places:</strong> checked areas have fewer than two places listed as open.</li><li><strong>Grey — not enough data:</strong> opening times or search results are missing. This does not mean the road is empty.</li></ul><p>Compare routes for long stretches with few open places, nearby help points and extra travel time. Unknown stretches cannot support an activity recommendation.</p></details>
  </div>;
}
