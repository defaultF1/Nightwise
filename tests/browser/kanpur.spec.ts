import {test,expect} from '@playwright/test';
test('Kanpur GPS switches search city, requires a local destination and leaves tutorial intact',async({page,context})=>{
 await context.grantPermissions(['geolocation']);await context.setGeolocation({latitude:26.48,longitude:80.30,accuracy:20});await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/status',r=>r.fulfill({json:{ready:true,searchEnabled:true,searchPreviewEnabled:true,activityEnabled:true}}));
 let anchor:any;await page.route('**/api/places/suggest',r=>{anchor=r.request().postDataJSON().anchor;return r.fulfill({json:{suggestions:[{id:'school',title:'Dr. Virendra Swarup Education Centre',address:'Sharda Nagar, Kanpur'}]}});});
 await page.route('**/api/places/preview',r=>r.fulfill({json:{checkedAt:new Date().toISOString(),estimates:[{id:'school',available:true,distanceMeters:1800,durationSeconds:360}]}}));
 await page.route('**/api/places/resolve',r=>r.fulfill({json:{coordinate:{latitude:26.481,longitude:80.305},address:'Sharda Nagar, Kanpur'}}));
 await page.goto('/');await page.getByRole('button',{name:'Use my location',exact:true}).click();await page.getByRole('button',{name:'Get current location'}).click();
 await expect(page.locator('.place-field').first()).toContainText('Current location');await expect(page.locator('.place-field.destination')).toContainText('Choose destination in Kanpur');await expect(page.getByRole('button',{name:'Compare night routes'})).toBeDisabled();
 await page.locator('.place-field.destination').click();await expect(page.getByRole('button',{name:'Search Kanpur',exact:true})).toBeVisible();await page.getByLabel('Search places').fill('Virendra Swarup Sharda Nagar');await expect(page.locator('.search-result')).toContainText('1.8 km · 6 min');expect(anchor).toEqual({latitude:26.48,longitude:80.3});
 await page.locator('.search-result').click();await expect(page.getByRole('button',{name:'Compare night routes'})).toBeEnabled();await page.getByRole('button',{name:'Tutorial mode',exact:true}).click();await expect(page.locator('.place-field').first()).toContainText('AEOS');await expect(page.locator('.place-field.destination')).toContainText('Manyata Tech Park');
});
