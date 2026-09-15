import {test,expect} from '@playwright/test';

test.skip(process.env.NIGHTWISE_TEST_GEOAPIFY!=='1','Run against npm run dev:geoapify with NIGHTWISE_TEST_GEOAPIFY=1.');

test('route taps use a generous nearest-road target while pins still open their popup',async({page})=>{
 const errors:string[]=[],google:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route(/https:\/\/[^/]*(googleapis|gstatic|google)\./,r=>{google.push(r.request().url());return r.abort();});
 // Tile contents do not affect this geometry test; avoid provider charges.
 const tile=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle='#111';ctx.fillRect(0,0,256,256);return c.toDataURL().split(',')[1];});
 await page.route('**/api/tiles/**',r=>r.fulfill({contentType:'image/png',body:Buffer.from(tile,'base64')}));
 await page.route('**/__map-test',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><body style="margin:0"></body></html>'}));
 await page.goto('/__map-test');
 await page.evaluate(async()=>{
  document.body.replaceChildren();const el=document.createElement('div');el.style.cssText='width:390px;height:600px';document.body.append(el);
  const modulePath='/src/maps/maplibre.ts';const {createMapLibre}=await import(/* @vite-ignore */ modulePath);
  const map=await createMapLibre(el,'dark',(id:string)=>el.dataset.selected=id,{latitude:13.055,longitude:77.607});
  const road=[{latitude:13.05,longitude:77.607},{latitude:13.06,longitude:77.607}];
  await map.draw([
   {id:'test-road',path:road,color:'#eeeeee',width:4,clickable:true},
   {id:'alternative',path:road.map(p=>({...p,longitude:77.608})),color:'#8293a0',width:4,clickable:true},
   {id:'test-road',path:road,color:'#f4b86a',width:7,clickable:false}
  ],[],[],[{latitude:13.055,longitude:77.607,name:'Test shop',kind:'shop',status:'Opening hours unknown'}]);
 });
 await expect(async()=>{
  // 14 CSS pixels away from the actual road, outside its visible painted width.
  await page.locator('.maplibregl-canvas').click({position:{x:181,y:250}});
  await expect(page.locator('[data-selected="test-road"]')).toHaveCount(1);
 }).toPass({timeout:10000});
 await page.locator('.maplibregl-canvas').click({position:{x:218,y:250}});
 await expect(page.locator('[data-selected="alternative"]')).toHaveCount(1);
 await page.locator('.maplibregl-canvas').click({position:{x:199,y:250}});
 await expect(page.locator('[data-selected="test-road"]')).toHaveCount(1);
 await page.locator('.maplibregl-canvas').click({position:{x:218,y:250}});
 await page.getByRole('button',{name:'Test shop · Opening hours unknown',exact:true}).click();
 await expect(page.locator('.maplibregl-popup-content')).toContainText('Test shop');
 await expect(page.locator('[data-selected="alternative"]')).toHaveCount(1);
 await page.locator('.maplibregl-canvas').click({position:{x:40,y:100}});
 await expect(page.locator('[data-selected="alternative"]')).toHaveCount(1);
 expect(errors).toEqual([]);expect(google).toEqual([]);
});
