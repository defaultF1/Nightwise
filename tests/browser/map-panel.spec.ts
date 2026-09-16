import {test,expect} from '@playwright/test';
import {sampleRouteOptions} from '../../src/providers/routes';
import {buildQueryPlan,analyzeRoute} from '../../src/domain/activity';
import {fixtureScans,TUTORIAL_CHECKED_AT} from '../../src/data/activity-fixtures';
test('light map panels retain endpoint padding, readable labels and full-screen controls',async({page})=>{
 await page.setViewportSize({width:360,height:800});await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>localStorage.setItem('nightwise.appearance.v1','light'));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const tile=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle='#e8e9e5';ctx.fillRect(0,0,256,256);ctx.strokeStyle='#c7c9c4';for(let i=0;i<256;i+=32){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,256);ctx.moveTo(0,i);ctx.lineTo(256,i);ctx.stroke();}return c.toDataURL().split(',')[1];});
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/tiles/**',r=>r.fulfill({contentType:'image/png',body:Buffer.from(tile,'base64')}));
 const routes=sampleRouteOptions('AEOS','normal').map(r=>({...r,source:'geoapify' as const,geometryKind:'provider' as const}));
 const plan=buildQueryPlan(routes),analyses=routes.map(r=>analyzeRoute(r,plan,fixtureScans(plan,'normal'),TUTORIAL_CHECKED_AT));
 await page.route('**/api/compare',r=>r.fulfill({json:{routes,analyses,comparison:{version:'fixture',selectedId:routes[0].id,fastestId:routes[0].id,recommendedId:null,outcome:'similar',message:'Comparison fixture',commonComponents:[],scores:{}},checkedAt:TUTORIAL_CHECKED_AT,activityStatus:'complete',notices:[],attributions:[],usage:{routeCalls:1,nearbyCalls:0,routeLimit:100,nearbyLimit:100,remainingComparisons:10}}}));
 await page.goto('/');await page.getByRole('button',{name:'Live routes',exact:true}).click();await page.getByRole('button',{name:'Compare night routes'}).click();await page.getByRole('button',{name:'Confirm and compare'}).click();
 await expect(page.locator('.map-cover')).toHaveCount(0,{timeout:30000});
 const panel=page.locator('.live-map');await panel.scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const slot=await panel.locator('.map-slot').boundingBox();
 for(const label of ['AEOS','Manyata Tech Park']){
  const pin=await panel.getByRole('button',{name:label,exact:true}).boundingBox();expect(pin).not.toBeNull();expect(pin!.y-slot!.y).toBeGreaterThan(15);expect(slot!.y+slot!.height-pin!.y-pin!.height).toBeGreaterThan(15);
 }
 await expect(panel.locator('.camera-layer h3')).toContainText('Mapped cameras');
 await panel.screenshot({path:'test-results/map-panel-light.png'});
 await panel.getByRole('button',{name:'Full screen',exact:true}).click();await expect(panel).toHaveClass(/map-expanded/);
 await expect(panel.getByRole('button',{name:'Minimize map'})).toBeInViewport();
 await page.setViewportSize({width:800,height:360});await expect(panel.getByRole('button',{name:'Minimize map'})).toBeInViewport();
 expect((await panel.locator('.map-slot').boundingBox())!.height).toBeGreaterThan(120);
 await page.keyboard.press('Escape');await expect(panel).not.toHaveClass(/map-expanded/);expect(errors).toEqual([]);
});
