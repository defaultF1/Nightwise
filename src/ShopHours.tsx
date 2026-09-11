import type { ActivityAnalysis } from './domain/activity-types';
import { assumedShopHours } from './domain/assumed-hours';
function localTime(value?:string){return value&&Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',weekday:'short',hour:'numeric',minute:'2-digit'}).format(new Date(value)):null;}
export function ShopHours({analysis}:{analysis?:ActivityAnalysis}){
  return <details className="help-details shop-hours"><summary>Shop opening times and closed days</summary><p>Times are in Indian Standard Time (IST).{analysis?.source==='sample'?'':' Current schedules include special-day changes reported by Google.'}</p>
  {!analysis?.places.length?<p>No shop schedules were returned for this comparison.</p>:<div className="shop-hours-list">{analysis.places.map(p=>{
    const s=p.schedule, assumed=assumedShopHours(p,analysis.checkedAt);
    // A place with no schedule data gets one status line, not a list of empty sections.
    return <details key={p.id} className="shop-hours-item"><summary><strong>{p.name??p.categories[0]?.replaceAll('_',' ')??'Place listing'}</strong><span>{assumed?`${assumed.label} · ${assumed.open?'expected open':'expected closed'} when you pass`:p.hours.state==='unknown'?'Hours unknown':p.hours.state==='closed'?'Listed closed when you pass':p.hours.basis==='regular'?'Usually open when you pass':'Listed open when you pass'}</span></summary>
      <p>About {Math.round(p.arrivalMinutes??0)} min into the journey.{p.hours.closingSoon?' Closing soon after that.':''}</p>
      {p.hours.reason&&!assumed&&<p>{p.hours.reason}</p>}
      {assumed&&<p>{assumed.explanation}</p>}
      {localTime(s?.nextOpenTime)&&<p>Next listed opening: {localTime(s?.nextOpenTime)} IST</p>}{localTime(s?.nextCloseTime)&&<p>Next listed closing: {localTime(s?.nextCloseTime)} IST</p>}
      {!!s?.currentWeek.length&&<><h4>Current seven-day schedule</h4><ul>{s.currentWeek.map((t,i)=><li key={i}>{t}</li>)}</ul></>}
      {!!s?.regularWeek.length&&<><h4>Regular weekly schedule</h4><ul>{s.regularWeek.map((t,i)=><li key={i}>{t}</li>)}</ul></>}
      {!!s?.specialDates.length&&<p>Dates with special hours: {s.specialDates.join(', ')}. Use the current schedule above.</p>}
    </details>;
  })}</div>}</details>;
}
