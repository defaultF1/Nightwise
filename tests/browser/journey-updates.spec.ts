import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await page.route('https://**/*',r=>r.abort());await page.goto('/');});
test('swaps endpoints and confirms both pins before sending a request',async({page})=>{
 let calls=0;await page.route('**/api/compare',r=>{calls++;return r.fulfill({status:503,json:{message:'Test response'}});});
 await page.getByRole('button',{name:'Swap origin and destination'}).click();
 await expect(page.locator('.place-field').first()).toContainText('Manyata');
 await expect(page.locator('.place-field.destination')).toContainText('AEOS');
 await page.getByRole('button',{name:'Compare night routes'}).click();
 await expect(page.getByRole('dialog')).toContainText('13.062827');expect(calls).toBe(0);
 await page.getByRole('button',{name:'Confirm and compare'}).click();await expect(page.getByText('Test response Your journey is saved.')).toBeVisible();expect(calls).toBe(1);
});
test('saved manual pins survive relaunch and can be removed',async({page})=>{
 await page.locator('.place-field').first().click();await page.getByLabel('Favourite label').fill('Office');await page.getByRole('button',{name:'Save selected pin'}).click();
 await page.reload();await page.locator('.place-field.destination').click();await page.getByRole('button',{name:'Office',exact:true}).click();await expect(page.locator('.place-field.destination')).toContainText('Office');
 await page.locator('.place-field.destination').click();await page.getByRole('button',{name:'Remove Office'}).click();await expect(page.getByRole('button',{name:'Office',exact:true})).toHaveCount(0);
});
test('Google favourites keep IDs and refresh details without retaining provider coordinates',async({page})=>{
 await page.route('**/api/status',r=>r.fulfill({json:{ready:true,searchEnabled:true,activityEnabled:false,scoringEnabled:false}}));
 await page.route('**/api/places/suggest',r=>r.fulfill({json:{suggestions:[{id:'palace-id',title:'Bengaluru Palace',address:'Bengaluru'}]}}));
 await page.route('**/api/places/resolve',r=>r.fulfill({json:{coordinate:{latitude:13.0035,longitude:77.5891},address:'Palace Road, Bengaluru'}}));
 await page.locator('.place-field.destination').click();await page.getByLabel('Search places').fill('Bengaluru Palace');await page.getByRole('button',{name:'Search Bengaluru'}).click();await page.getByRole('button',{name:/Bengaluru Palace Bengaluru/}).click();
 await page.locator('.place-field.destination').click();await page.getByLabel('Favourite label').fill('Palace visit');await page.getByRole('button',{name:'Save selected pin'}).click();
 const saved=await page.evaluate(()=>localStorage.getItem('nightwise.favourites.v1'));expect(saved).toContain('palace-id');expect(saved).not.toContain('77.5891');expect(saved).not.toContain('Palace Road');
 await page.reload();let calls=0;await page.route('**/api/places/saved',r=>{calls++;return r.fulfill({json:{coordinate:{latitude:13.0036,longitude:77.5892},address:'Updated entrance'}});});
 await page.locator('.place-field.destination').click();await page.getByRole('button',{name:'Palace visit',exact:true}).click();expect(calls).toBe(1);
 await page.getByRole('button',{name:'Compare night routes'}).click();await expect(page.getByRole('dialog')).toContainText('Updated entrance');
});
test('time preference persists and evidence and freshness are visible',async({page})=>{
 await page.getByLabel('Extra travel time',{exact:true}).selectOption('0');await page.reload();await expect(page.getByLabel('Extra travel time',{exact:true})).toHaveValue('0');
 await page.getByRole('button',{name:'Compare night routes'}).click();await expect(page.getByRole('radio',{name:'Fastest',exact:true})).toBeChecked();
 await expect(page.getByRole('region',{name:'Evidence confidence'})).toContainText('Known hours');await expect(page.getByRole('button',{name:'Refresh sample'})).toBeVisible();
 await page.getByText('Help points on selected route',{exact:true}).click();await expect(page.getByText('Longest gap without a listed open help point:',{exact:false})).toBeVisible();
 await page.setViewportSize({width:320,height:640});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
