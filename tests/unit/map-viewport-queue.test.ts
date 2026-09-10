import {expect,it,vi} from 'vitest';
import {latestViewportUpdate,type Rect} from '../../src/maps/viewport';
const rect=(top:number):Rect=>({left:20,top,right:320,bottom:top+300});
it('drops obsolete clipping positions while a native update is in flight',async()=>{
 let release!:()=>void;const update=vi.fn((_rect:Rect)=>new Promise<void>(resolve=>{release=resolve;}));const queue=latestViewportUpdate(update);
 queue.push(rect(100));queue.push(rect(80));queue.push(rect(60));expect(update).toHaveBeenCalledTimes(1);
 release();await Promise.resolve();expect(update).toHaveBeenCalledTimes(2);expect(update.mock.calls[1][0]).toEqual(rect(60));release();await Promise.resolve();queue.stop();
});
it('does not deliver pending positions after the map is destroyed',async()=>{
 let release!:()=>void;const update=vi.fn((_rect:Rect)=>new Promise<void>(resolve=>{release=resolve;}));const queue=latestViewportUpdate(update);
 queue.push(rect(100));queue.push(rect(80));queue.stop();release();await Promise.resolve();queue.push(rect(0));expect(update).toHaveBeenCalledTimes(1);
});
it('recovers on the next measured position after a failed bridge call',async()=>{
 const update=vi.fn().mockRejectedValueOnce(new Error('bridge unavailable')).mockResolvedValue(undefined);const queue=latestViewportUpdate(update);
 queue.push(rect(100));await Promise.resolve();queue.push(rect(80));await Promise.resolve();expect(update).toHaveBeenCalledTimes(2);queue.stop();
});
