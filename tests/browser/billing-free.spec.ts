import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await page.route('https://**/*',r=>r.abort());await page.goto('/');await page.getByRole('button',{name:'Live routes',exact:true}).click();});
test('offline pin search filters and retains the supplied demo without Google calls',async({page})=>{
 let requests=0;page.on('request',r=>{if(r.url().includes('googleapis.com')||r.url().includes('/api/places/'))requests++;});
 await page.locator('.place-field.destination').click();await page.getByLabel('Search places').fill('manayata');await expect(page.getByRole('region',{name:'Supplied locations'}).getByRole('button')).toHaveCount(1);
 await page.getByRole('button',{name:/Manyata Tech Park.*available offline/}).click();await expect(page.getByRole('button',{name:'Live routes',exact:true})).toHaveAttribute('aria-pressed','true');expect(requests).toBe(0);
});
test('paused wider search returns a clear message without provider requests',async({page})=>{
 let search=0;await page.route('**/api/status',r=>r.fulfill({json:{ready:false,paused:true,searchEnabled:false,activityEnabled:false}}));await page.route('**/api/places/**',r=>{search++;return r.abort();});
 await page.locator('.place-field.destination').click();await page.getByLabel('Search places').fill('Airport');await page.getByRole('button',{name:'Search Bengaluru'}).click();await expect(page.getByRole('status')).toContainText('search is paused');expect(search).toBe(0);
 await page.getByRole('dialog').screenshot({path:'talks/screenshots/prebilling/01-place-search-paused.png'});
});
test('explicit search uses one session and switches to the resolved destination',async({page})=>{
 const sessions:string[]=[];await page.route('**/api/status',r=>r.fulfill({json:{ready:true,searchEnabled:true,activityEnabled:false}}));
 await page.route('**/api/places/suggest',r=>{sessions.push(r.request().postDataJSON().sessionToken);return r.fulfill({json:{suggestions:[{id:'test-place',title:'Test Bengaluru destination',address:'Controlled browser fixture'}]}});});
 await page.route('**/api/places/resolve',r=>{sessions.push(r.request().postDataJSON().sessionToken);return r.fulfill({json:{coordinate:{latitude:13.07,longitude:77.61}}});});
 await page.locator('.place-field.destination').click();await page.getByLabel('Search places').fill('Test Bengaluru');expect(sessions).toHaveLength(0);await page.getByRole('button',{name:'Search Bengaluru'}).click();await page.getByRole('button',{name:/Test Bengaluru destination/}).click();await expect(page.locator('.place-field.destination')).toContainText('Test Bengaluru destination');await expect(page.getByRole('button',{name:'Live routes',exact:true})).toHaveAttribute('aria-pressed','true');expect(sessions).toHaveLength(2);expect(sessions[0]).toBe(sessions[1]);
});
test('editing search ignores late suggestions',async({page})=>{
 await page.route('**/api/status',r=>r.fulfill({json:{ready:true,searchEnabled:true,activityEnabled:false}}));await page.route('**/api/places/suggest',async r=>{await new Promise(resolve=>setTimeout(resolve,600));await r.fulfill({json:{suggestions:[{id:'old',title:'Old result',address:'Fixture'}]}}).catch(()=>{});});
 await page.locator('.place-field.destination').click();await page.getByLabel('Search places').fill('Old query');await page.getByRole('button',{name:'Search Bengaluru'}).click();await page.getByLabel('Search places').fill('AEOS');await page.waitForTimeout(800);await expect(page.getByRole('button',{name:/Old result/})).toHaveCount(0);await expect(page.getByRole('button',{name:/AEOS.*available offline/})).toBeVisible();
});
test('opening the live map never creates a Google script',async({page})=>{
 let google=0;page.on('request',r=>{if(r.url().includes('googleapis.com'))google++;});await page.getByRole('button',{name:'Compare night routes'}).click();await expect(page.getByRole('dialog')).toContainText('Step 1 of 2');await expect(page.locator('.map-canvas')).toBeVisible();expect(google).toBe(0);await expect(page.locator('script[src*="maps.googleapis.com"]')).toHaveCount(0);
 await page.screenshot({path:'talks/screenshots/prebilling/02-map-paused.png',fullPage:true});
});
