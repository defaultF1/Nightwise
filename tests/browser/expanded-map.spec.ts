import {test,expect} from '@playwright/test';
import {sampleRouteOptions} from '../../src/providers/routes';
import {analyzeComparison} from '../../src/domain/analyze-comparison';
import {fixtureScans,fixtureRoadEvidence,TUTORIAL_CHECKED_AT} from '../../src/data/activity-fixtures';

const mapStub = `
(()=>{
window.mapCreates=0; window.mapOptions={};
class Map { constructor(el,options){window.mapCreates++;window.mapOptions=options;el.dataset.mapInstance=String(window.mapCreates)} setOptions(o){Object.assign(window.mapOptions,o)} fitBounds(){} }
class Shape {setMap(){} addListener(){} }
window.google={maps:{Map,Polyline:Shape,Marker:Shape,LatLngBounds:class{extend(){}},Point:class{},SymbolPath:{CIRCLE:0},event:{clearInstanceListeners(){}}}};
window.nightwiseMapReady();})();`;

async function checkSize(page:import('@playwright/test').Page){
 const rect=await page.locator('.map-expanded').boundingBox();
 const viewport=page.viewportSize()!;
 expect(rect!.x).toBe(0);expect(rect!.y).toBe(0);
 expect(Math.abs(rect!.width-viewport.width)).toBeLessThan(2);
 expect(Math.abs(rect!.height-viewport.height)).toBeLessThan(2);
 await expect(page.getByRole('button',{name:'Minimize map'})).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}

for(const theme of ['dark','light','blue'])test(`full-screen endpoint map in ${theme} keeps map instance and parent sheet`,async({page})=>{
 await page.setViewportSize({width:360,height:800});
 await page.addInitScript(theme=>localStorage.setItem('nightwise.appearance.v1',theme),theme);
 await page.route('https://**/*',r=>r.abort());
 await page.route('https://maps.googleapis.com/maps/api/js?*',r=>r.fulfill({contentType:'text/javascript',body:mapStub}));
 await page.goto('/');
 await page.getByRole('button',{name:'Live routes',exact:true}).click();
 await page.getByRole('button',{name:'Compare night routes'}).click();
 await expect(page.locator('.map-canvas')).toHaveAttribute('data-map-instance','1');
 await page.getByRole('button',{name:'Full screen',exact:true}).click();
 await checkSize(page);
 await expect(page.getByRole('heading',{name:'Confirm your journey'})).toBeHidden();
 await page.evaluate(()=>document.documentElement.dataset.nativeMap='true');
 const opaque=await page.locator('.map-canvas').evaluate(el=>{
  const result:string[]=[];for(let p=el.parentElement;p;p=p.parentElement){const s=getComputedStyle(p);if(!['transparent','rgba(0, 0, 0, 0)'].includes(s.backgroundColor))result.push(p.className);}return result;
 });
 expect(opaque).toEqual([]);
 await page.screenshot({path:`test-results/expanded-map-${theme}.png`});
 await page.setViewportSize({width:800,height:360});await checkSize(page);
 await page.keyboard.press('Escape');
 await expect(page.locator('.map-expanded')).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Confirm your journey'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Full screen',exact:true})).toBeFocused();
 expect(await page.evaluate(()=>document.querySelectorAll('.map-expanded-away,[inert]').length)).toBe(0);
 expect(await page.evaluate(()=>Reflect.get(window,'mapCreates'))).toBe(1);
});

test('live route selection survives expansion without further compare requests',async({page})=>{
 let compares=0;
 const routes=sampleRouteOptions('AEOS','three').map(r=>({...r,source:'google',geometryKind:'provider'}));
 const samples=sampleRouteOptions('AEOS','three');
 const analyzed=analyzeComparison(samples,p=>fixtureScans(p,'normal'),TUTORIAL_CHECKED_AT,fixtureRoadEvidence(samples,'normal'));
 await page.route('https://**/*',r=>r.abort());
 await page.route('https://maps.googleapis.com/maps/api/js?*',r=>r.fulfill({contentType:'text/javascript',body:mapStub}));
 await page.route('**/api/**',r=>{
  if(new URL(r.request().url()).hostname==='maps.googleapis.com') return r.fallback();
  if(r.request().url().endsWith('/compare')){compares++;return r.fulfill({json:{routes,analyses:analyzed.analyses,comparison:analyzed.comparison,checkedAt:new Date().toISOString(),activityStatus:'complete',notices:[],attributions:[],usage:{remainingComparisons:1}}});}
  return r.fulfill({json:{ready:true}});
 });
 await page.goto('/');await page.getByRole('button',{name:'Live routes',exact:true}).click();
 await page.getByRole('button',{name:'Compare night routes'}).click();
 await expect(page.locator('.map-canvas')).toHaveAttribute('data-map-instance',/\d+/);
 await page.getByRole('button',{name:'Confirm and compare'}).click();
 const map=page.locator('.live-map');await expect(map.locator('.map-route-options button')).toHaveCount(3);
 await expect(map.locator('.map-canvas')).toHaveAttribute('data-map-instance',/\d+/);
 const id=await map.locator('.map-canvas').getAttribute('data-map-instance');
 await map.getByRole('button',{name:'Full screen',exact:true}).click();
 await map.locator('.map-route-options button').nth(1).click();
 await map.getByRole('button',{name:'Minimize map'}).click();
 await expect(map.locator('.map-route-options button').nth(1)).toHaveAttribute('aria-pressed','true');
 await expect(map.locator('.map-canvas')).toHaveAttribute('data-map-instance',id!);
 expect(compares).toBe(1);
});

test('tutorial expands offline and minimizes via the app Back event',async({page})=>{
 await page.route('https://**/*',r=>r.abort());await page.goto('/');
 await page.getByRole('button',{name:'Compare night routes'}).click();
 await page.getByRole('button',{name:'Full screen',exact:true}).click();await checkSize(page);
 await page.locator('.diagram-options button').last().click();
 await page.evaluate(()=>window.dispatchEvent(new Event('nightwise-minimize-map')));
 await expect(page.locator('.map-expanded')).toHaveCount(0);
 await expect(page.locator('.diagram-options button').last()).toHaveAttribute('aria-pressed','true');
});
