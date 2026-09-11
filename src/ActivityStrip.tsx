export function formatMeters(value:number|null):string{
  if(value===null||!Number.isFinite(value))return 'Not assessed';if(value===0)return 'None observed';
  return value>=1000?`~${(value/1000).toFixed(1)} km`:`~${Math.max(1,Math.round(value/50)*50)} m`;
}
