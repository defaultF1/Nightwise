import {expect,test} from 'vitest';
import {syncNestedMapScroll} from '../../src/maps/scroll-sync';
test('nested dialog scrolling notifies the native viewport once per frame and cleans up',()=>{
  const parent=Object.assign(new EventTarget(),{parentElement:null});
  const element={parentElement:parent} as unknown as HTMLElement;
  let next:(()=>void)|undefined;let notifications=0;let cancelled=false;
  const viewport=Object.assign(new EventTarget(),{requestAnimationFrame:(fn:()=>void)=>{next=fn;return 1;},cancelAnimationFrame:()=>{cancelled=true;next=undefined;}});
  viewport.addEventListener('scroll',()=>notifications++);
  const stop=syncNestedMapScroll(element,viewport as unknown as Window);
  parent.dispatchEvent(new Event('scroll'));parent.dispatchEvent(new Event('scroll'));
  expect(notifications).toBe(0);next!();expect(notifications).toBe(1);
  parent.dispatchEvent(new Event('scroll'));stop();expect(cancelled).toBe(true);
  parent.dispatchEvent(new Event('scroll'));expect(next).toBeUndefined();expect(notifications).toBe(1);
});
