import type {LiveJourney} from '../domain/journey';
import type {LiveResult} from '../domain/live-contract';
import {assumedShopHours} from '../domain/assumed-hours';
import {CAMERA_FRESHNESS_MS} from '../domain/cameras';

export const COMPARISON_CACHE_MS=5*60_000;
// Session memory only: no credentials or journey history are written to disk.
export class ComparisonCache {
  private entries=new Map<string,{savedAt:number;expiresAt:number;result:LiveResult}>();
  constructor(private now=()=>Date.now(),private max=3){}
  key(journey:LiveJourney,accessCode:string){return JSON.stringify([journey.origin.latitude,journey.origin.longitude,journey.destination.latitude,journey.destination.longitude,journey.mode,journey.departureTime??null,accessCode]);}
  requiresFresh(key:string):boolean{
    const entry=this.entries.get(key);if(!entry)return false;
    const now=this.now();return now<Date.parse(entry.result.checkedAt)||now>=entry.expiresAt||now-entry.savedAt>=COMPARISON_CACHE_MS;
  }
  get(key:string):LiveResult|undefined{
    const entry=this.entries.get(key);if(!entry)return;
    if(this.requiresFresh(key))return;
    return {...structuredClone(entry.result),cacheSource:'device',requestUsage:{routeCalls:0,nearbyCalls:0,detailsCalls:0,scope:'Comparison reused on this device; no Routes or Places comparison requests. Map loads and search suggestions are separate.'}};
  }
  set(key:string,result:LiveResult){
    if(result.activityStatus==='budget'||!result.routes.length)return;
    const checked=Date.parse(result.checkedAt);let expiresAt=checked+COMPARISON_CACHE_MS;
    for (const analysis of result.analyses) {
      const cameras = analysis.cameras;
      if (!cameras || cameras.status !== 'complete') continue;
      const cameraChecked = Date.parse(cameras.checkedAt);
      if (!Number.isFinite(cameraChecked)) return;
      expiresAt = Math.min(expiresAt, cameraChecked + CAMERA_FRESHNESS_MS);
      for (const report of cameras.reports) if (report.expiresAt) {
        const expiry = Date.parse(report.expiresAt);
        if (!Number.isFinite(expiry)) return;
        if (expiry > checked) expiresAt = Math.min(expiresAt, expiry);
      }
    }
    // A known opening/closing boundary can invalidate sooner than five minutes.
    for(const a of result.analyses.filter(a=>!(Date.parse(a.checkedAt)>checked)))for(const p of a.places){
      if(p.hours.state==='open'&&p.hours.minutesUntilClose!==null&&Number.isFinite(p.hours.minutesUntilClose))expiresAt=Math.min(expiresAt,checked+p.hours.minutesUntilClose*60000);
      for(const time of [p.schedule?.nextOpenTime,p.schedule?.nextCloseTime]){
        const transition=Date.parse(time??'')-(p.arrivalMinutes??0)*60000;
        if(transition>checked)expiresAt=Math.min(expiresAt,transition);
      }
      const estimate=assumedShopHours(p,result.checkedAt);
      if(estimate&&assumedShopHours(p,new Date(checked+COMPARISON_CACHE_MS).toISOString())?.open!==estimate.open)return;
    }
    this.entries.delete(key);
    if(this.entries.size>=this.max)this.entries.delete(this.entries.keys().next().value!);
    this.entries.set(key,{savedAt:this.now(),expiresAt,result:structuredClone(result)});
  }
  delete(key:string){this.entries.delete(key);}
  invalidate(key:string){const entry=this.entries.get(key);if(entry)entry.expiresAt=0;}
}
