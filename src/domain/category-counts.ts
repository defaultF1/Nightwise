import type { ActivityAnalysis } from './activity-types';

// Plain-language groups a rider recognises. A place can appear in more than
// one group (a hospital pharmacy counts as medical and hospital).
export const PLACE_GROUPS=[
  {id:'medical',label:'Medical stores',categories:['pharmacy','drugstore']},
  {id:'hospital',label:'Hospitals',categories:['hospital']},
  {id:'fuel',label:'Petrol pumps',categories:['gas_station']},
  {id:'shops',label:'Shops & food',categories:['store','convenience_store','supermarket','shopping_mall','cafe','restaurant','bakery']},
] as const;

export type GroupCount={open:number;closed:number;unknown:number;total:number};
export function groupCounts(analysis:ActivityAnalysis|undefined,categories:readonly string[]):GroupCount{
  const places=analysis?.places.filter(p=>p.categories.some(c=>categories.includes(c)))??[];
  const open=places.filter(p=>p.hours.state==='open').length;
  const closed=places.filter(p=>p.hours.state==='closed').length;
  return {open,closed,unknown:places.length-open-closed,total:places.length};
}
export function groupSummary(count:GroupCount):string{
  if(!count.total)return 'None seen nearby';
  if(!count.open&&!count.closed)return `${count.unknown} seen · hours unknown`;
  const parts=[`${count.open} open`,`${count.closed} closed`];
  if(count.unknown)parts.push(`${count.unknown} unknown`);
  return parts.join(' · ');
}
