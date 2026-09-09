import { test, expect } from '@playwright/test';
const paths=[[
 {latitude:13.0628268,longitude:77.5940888},{latitude:13.064,longitude:77.608},{latitude:13.047697,longitude:77.619939}
],[{latitude:13.0628268,longitude:77.5940888},{latitude:13.047,longitude:77.601},{latitude:13.047697,longitude:77.619939}]];
function fixture(){return {routes:paths.map((path,i)=>({id:`google:${i}`,label:i?'Alternative 1':'Fastest',path,durationSeconds:i?1320:1080,distanceMeters:i?4400:3800,source:'google',geometryKind:'provider'})),analyses:[],comparison:{version:'sample-activity-v1',fastestId:'google:0',selectedId:'google:0',recommendedId:null,outcome:'insufficient',message:'Not enough information to recommend a route.',commonComponents:[],scores:{}},checkedAt:new Date().toISOString(),activityStatus:'disabled',notices:['Live activity scans are switched off.'],attributions:[],usage:{routeCalls:1,nearbyCalls:0,routeLimit:10,nearbyLimit:600,remainingComparisons:9}};}
test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await page.route('https://maps.googleapis.com/**',r=>r.abort());await page.goto('/');});
test('configuration checks do not compare; missing server configuration is explicit',async({page})=>{
 let compares=0;await page.route('**/api/status',r=>r.fulfill({json:{ready:false,activityEnabled:false,scoringEnabled:false,accessCodeRequired:false,maxQueries:120}}));await page.route('**/api/compare',r=>{compares++;return r.fulfill({status:503,json:{message:'Live routes need the server key and enabled Google services.'}});});
 await page.getByRole('button',{name:'Open settings'}).click();await page.getByText('Live service',{exact:true}).click();await page.getByRole('button',{name:'Check connection'}).click();await expect(page.getByRole('dialog')).toContainText('Add the restricted server key');expect(compares).toBe(0);await page.getByRole('button',{name:'Done',exact:true}).click();
 await page.getByRole('button',{name:'Live routes',exact:true}).click();await page.getByRole('button',{name:'Compare night routes'}).click();await page.getByRole('button',{name:'Confirm and compare'}).click();await expect(page.getByRole('heading',{name:'We couldn’t load routes'})).toBeVisible();await expect(page.getByRole('main')).toContainText('server key');expect(compares).toBe(1);
 await page.locator('.state-panel img').evaluate((img:HTMLImageElement)=>img.decode());
 await page.screenshot({path:'talks/screenshots/M04/01-missing-server-key.png',fullPage:true});
});
test('live routes have no invented activity and selected corridor handoff survives map failure',async({page})=>{
 let compares=0;await page.route('**/api/compare',r=>{compares++;return r.fulfill({json:fixture()});});
 await page.getByRole('button',{name:'Live routes',exact:true}).click();await page.getByRole('button',{name:'Compare night routes'}).click();await page.getByRole('button',{name:'Confirm and compare'}).click();await expect(page.getByRole('radio',{name:'Fastest',exact:true})).toBeChecked();
 await expect(page.locator('.activity-score')).toHaveCount(0);await expect(page.locator('.route-summary').first()).toContainText('unavailable');
 await page.getByRole('radio',{name:'Alternative 1',exact:true}).check();await page.getByRole('button',{name:'Continue with this route'}).click();const url=new URL((await page.getByRole('link',{name:'Open Google Maps'}).getAttribute('href'))!);expect(url.searchParams.get('waypoints')).toBeTruthy();expect(url.searchParams.get('destination')).toBe('13.047697,77.619939');await expect(page.getByRole('dialog')).toContainText('three points');
 await page.getByRole('dialog').screenshot({path:'talks/screenshots/M05/01-browser-handoff-mocked-provider.png'});
 await page.getByRole('button',{name:'Keep comparing'}).click();await expect(page.getByRole('radio',{name:'Alternative 1',exact:true})).toBeChecked();expect(compares).toBe(1);
});
test('late live responses cannot replace a cancelled journey',async({page})=>{
 await page.route('**/api/compare',async r=>{await new Promise(resolve=>setTimeout(resolve,900));await r.fulfill({json:fixture()}).catch(()=>{});});
 await page.getByRole('button',{name:'Live routes',exact:true}).click();await page.getByRole('button',{name:'Compare night routes'}).click();await page.getByRole('button',{name:'Confirm and compare'}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.waitForTimeout(1100);await expect(page.getByRole('button',{name:'Compare night routes'})).toBeVisible();await expect(page.getByRole('radiogroup',{name:'Select a route'})).toHaveCount(0);
});
test('location denial leaves presets usable',async({page})=>{
 await page.addInitScript(()=>{navigator.geolocation.getCurrentPosition=(_ok,error)=>error?.({code:1,message:'Denied',PERMISSION_DENIED:1,POSITION_UNAVAILABLE:2,TIMEOUT:3});});await page.reload();
 await page.getByRole('button',{name:'Use my location'}).click();await page.getByRole('button',{name:'Get current location'}).click();await expect(page.getByRole('status')).toContainText('declined');await page.getByRole('button',{name:'Choose a pin instead'}).click();await page.getByRole('button',{name:/AEOS Bengaluru/}).click();await expect(page.getByRole('button',{name:/FROM AEOS/})).toBeVisible();
});
test('one-time current location is sent only after explicit comparison',async({page,context})=>{
 await context.grantPermissions(['geolocation']);await context.setGeolocation({latitude:13.061,longitude:77.595,accuracy:15});let payload:any;await page.route('**/api/compare',r=>{payload=r.request().postDataJSON();return r.fulfill({json:fixture()});});
 await page.getByRole('button',{name:'Use my location'}).click();await page.getByRole('button',{name:'Get current location'}).click();await expect(page.getByRole('button',{name:/FROM Current location/})).toBeVisible();expect(payload).toBeUndefined();await page.getByRole('button',{name:'Compare night routes'}).click();await page.getByRole('button',{name:'Confirm and compare'}).click();await expect(page.getByRole('radio',{name:'Fastest',exact:true})).toBeVisible();expect(payload.origin.latitude).toBe(13.061);
});
test('old results require explicit refresh without automatic rescanning',async({page})=>{
 let calls=0;await page.route('**/api/compare',r=>{calls++;return r.fulfill({json:{...fixture(),checkedAt:new Date(Date.now()-6*60_000).toISOString()}});});await page.getByRole('button',{name:'Live routes',exact:true}).click();await page.getByRole('button',{name:'Compare night routes'}).click();await page.getByRole('button',{name:'Confirm and compare'}).click();await expect(page.getByRole('radio',{name:'Fastest',exact:true})).toBeVisible();await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await expect(page.getByRole('button',{name:'Refresh live results'})).toBeVisible();expect(calls).toBe(1);
});

test('live response without shop analysis keeps evidence sections and details usable',async({page})=>{
 await page.route('**/api/compare',r=>r.fulfill({json:fixture()}));
 await page.getByRole('button',{name:'Live routes',exact:true}).click();await page.getByRole('button',{name:'Compare night routes'}).click();
 await expect(page.getByRole('dialog')).toContainText('Step 1 of 2');
 await page.getByRole('button',{name:'Confirm and compare'}).click();
 await expect(page.getByRole('region',{name:'Evidence confidence'})).toContainText('Not assessed');
 await page.getByText('Help points on selected route',{exact:true}).click();await expect(page.locator('.help-points')).toContainText('Unknown');
 await page.getByRole('button',{name:'Alternative 1 · 22 min',exact:true}).click();
 await expect(page.getByRole('radio',{name:'Alternative 1',exact:true})).toBeChecked();
 await expect(page.locator('.diagram-caption').first()).toContainText('Alternative 1 is highlighted');
 await expect(page.locator('.pin-legend')).toContainText('Start / current location');
 await expect(page.locator('.pin-legend')).toContainText('Petrol / CNG');
 await page.getByRole('radio',{name:'Fastest',exact:true}).check();await expect(page.getByRole('button',{name:'Fastest · 18 min',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'View activity details'}).first().click();await expect(page.getByRole('dialog')).toContainText('no shop analysis');
 await page.getByRole('button',{name:'Back to routes',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
});
