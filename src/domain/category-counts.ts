import type { ActivityAnalysis } from './activity-types';
import { assumedShopHours } from './assumed-hours';

// Plain-language groups a rider recognises. A place can appear in more than
// one group (a hospital pharmacy counts as medical and hospital).
export const PLACE_GROUPS=[
  {id:'medical',label:'Medical stores',categories:['pharmacy','drugstore']},
  {id:'hospital',label:'Hospitals',categories:['hospital']},
  {id:'fuel',label:'Petrol pumps',categories:['gas_station']},
  {id:'shops',label:'Shops & food',categories:['store','convenience_store','supermarket','shopping_mall','grocery_store','department_store','cafe','restaurant','bakery']},
] as const;

export type GroupCount={open:number;closed:number;unknown:number;total:number;estimatedOpen?:number;estimatedClosed?:number};
export function groupCounts(analysis:ActivityAnalysis|undefined,categories:readonly string[]):GroupCount{
  const places=analysis?.places.filter(p=>p.categories.some(c=>categories.includes(c)))??[];
  const open=places.filter(p=>p.hours.state==='open').length;
  const closed=places.filter(p=>p.hours.state==='closed').length;
  const estimates=places.map(p=>assumedShopHours(p,analysis!.checkedAt)).filter(e=>e!==null);
  return {open,closed,unknown:places.length-open-closed-estimates.length,total:places.length,estimatedOpen:estimates.filter(e=>e.open).length,estimatedClosed:estimates.filter(e=>!e.open).length};
}
// Empty groups render nothing at all: the screen carries only what was seen.
export function groupSummary(count:GroupCount):string{
  if(!count.total)return '';
  const parts:string[]=[`${count.total} found`];
  if(count.open)parts.push(`${count.open} open`);
  if(count.closed)parts.push(`${count.closed} closed`);
  if(count.estimatedOpen)parts.push(`${count.estimatedOpen} estimated open`);
  if(count.estimatedClosed)parts.push(`${count.estimatedClosed} estimated closed`);
  // Unresolved opening hours stay included in "found"; details retain their status.
  return parts.join(' · ');
}
