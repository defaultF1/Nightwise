import type { Route } from './types';
export function passingMinutes(route:Route, distance:number, geometryLength:number):number{
  const fraction=Math.max(0,Math.min(1,distance/Math.max(1,geometryLength)));
  const steps=route.steps;
  if(!steps?.length||steps.some(s=>!Number.isFinite(s.staticDurationSeconds)||s.staticDurationSeconds!<0))return fraction*route.durationSeconds/60;
  const totalDistance=steps.reduce((n,s)=>n+s.distanceMeters,0), totalTime=steps.reduce((n,s)=>n+s.staticDurationSeconds!,0);
  if(!(totalDistance>0&&totalTime>0))return fraction*route.durationSeconds/60;
  let remaining=fraction*totalDistance, elapsed=0;
  for(const step of steps){const portion=step.distanceMeters>0?Math.min(1,remaining/step.distanceMeters):remaining>0?1:0;elapsed+=portion*step.staticDurationSeconds!;remaining=Math.max(0,remaining-step.distanceMeters);if(!remaining)break;}
  // Step static durations provide distribution only; total traffic-aware duration
  // scales it. This remains an estimate, not per-step real-time traffic timing.
  return elapsed/totalTime*route.durationSeconds/60;
}
