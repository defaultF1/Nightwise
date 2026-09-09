import { describe, it, expect, vi } from 'vitest';
import { createSampleRouteProvider, sampleRouteOptions, validateRoutes, validateJourney, type JourneyRequest } from '../../src/providers/routes';
import { pathLength } from '../../src/domain/geometry';
const request: JourneyRequest = { origin:'Manyata Tech Park',destinationId:'aeos',mode:'DRIVE',scenario:'normal' };
describe('M2 journey provider',()=>{
  it('returns truthful zero one two and three fixture alternatives for both origins',()=>{
    for(const origin of ['Manyata Tech Park','Sahakar Nagar'] as const) for(const [scenario,count] of [['normal',2],['none',0],['one',1],['three',3]] as const) {
      const routes=validateRoutes(sampleRouteOptions(origin,scenario)); expect(routes).toHaveLength(count);
      for(const route of routes){expect(route.geometryKind).toBe('illustrative');expect(route.distanceMeters).toBeCloseTo(pathLength(route.path),4);expect(route.path.at(-1)).toEqual({latitude:13.0628268,longitude:77.5940888});}
    }
  });
  it('rejects unsupported inputs and duplicate or malformed responses',()=>{
    expect(()=>validateJourney({...request,mode:'WALK'})).toThrow(/prepared/);
    expect(()=>validateJourney({...request,origin:'Unknown' as JourneyRequest['origin']})).toThrow();
    const routes=sampleRouteOptions(request.origin,'normal');
    expect(()=>validateRoutes([routes[0],routes[0]])).toThrow();
    expect(()=>validateRoutes([{...routes[0],durationSeconds:NaN}])).toThrow();
    expect(()=>validateRoutes([{...routes[0],path:[]}])).toThrow();
  });
  it('cancels before and during loading without returning results',async()=>{
    vi.useFakeTimers();
    const controller=new AbortController();
    const pending=createSampleRouteProvider().getRoutes(request,controller.signal);
    const assertion=expect(pending).rejects.toMatchObject({name:'AbortError'});
    controller.abort(); await assertion; expect(vi.getTimerCount()).toBe(0);
    await expect(createSampleRouteProvider().getRoutes(request,controller.signal)).rejects.toMatchObject({name:'AbortError'});
    vi.useRealTimers();
  });
  it('exposes recoverable errors and leaves requests unchanged',async()=>{
    const original=structuredClone(request);
    await expect(createSampleRouteProvider(0).getRoutes({...request,scenario:'error'},new AbortController().signal)).rejects.toMatchObject({retryable:true});
    await createSampleRouteProvider(0).getRoutes(request,new AbortController().signal); expect(request).toEqual(original);
  });
});
