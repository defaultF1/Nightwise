import type { Comparison } from './domain/activity-types';
export function LiveScore({comparison,id}:{comparison:Comparison;id:string}){
  const bounds=comparison.scoreBounds?.[id];
  if(!bounds)return null;
  return <span className="activity-score">Night Activity Score <b>{Math.floor(bounds[0])}–{Math.ceil(bounds[1])}/100</b><small>Experimental range · {Math.ceil(bounds[1])-Math.floor(bounds[0])>0?'Missing data widens the range':'All component bounds agree'} · not a safety rating</small></span>;
}
