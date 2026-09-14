import {test,expect} from '@playwright/test';

for(const theme of ['dark','light']) test(`search remains usable after keyboard-sized resize (${theme})`,async({page})=>{
  await page.route('https://**/*',r=>r.abort());
  await page.route('**/api/status',r=>r.fulfill({json:{ready:true,searchEnabled:true,activityEnabled:false}}));
  let searches=0;
  await page.route('**/api/places/suggest',r=>{searches++;return r.fulfill({json:{suggestions:[]}});});
  await page.goto('/');
  await page.getByRole('button',{name:'Live routes',exact:true}).click();
  await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  await page.locator('.place-field.destination').click();
  const input=page.getByLabel('Search places');
  await input.fill('Palace');
  await page.setViewportSize({width:360,height:440});
  await expect(page.getByRole('heading',{name:'Choose your destination'})).toBeInViewport();
  await expect(input).toBeInViewport();
  await input.press('Enter');
  await expect.poll(()=>searches).toBeGreaterThan(0);
  await expect(input).not.toBeFocused();
  expect(await page.locator('.sheet-body').evaluate(e=>e.clientHeight)).toBeGreaterThan(200);
  await page.setViewportSize({width:360,height:800});
  await expect(page.getByRole('heading',{name:'Choose your destination'})).toBeInViewport();
  await page.getByLabel('Favourite label').fill('Test home');
  await page.getByLabel('Favourite label').press('Enter');
  await expect(page.getByText('Place saved on this device.',{exact:true})).toBeVisible();
});

test('team code Done and coordinate Enter work in a reduced viewport',async({page})=>{
  await page.route('https://**/*',r=>r.abort());
  await page.goto('/');
  await page.getByRole('button',{name:'Open settings'}).click();
  await page.getByText('Live service',{exact:true}).click();
  const code=page.getByLabel('Team access code if required');
  await code.fill('test-only');
  await page.setViewportSize({width:360,height:440});
  await code.scrollIntoViewIfNeeded();
  await expect(code).toBeInViewport();
  await expect(page.getByRole('heading',{name:'Make it yours'})).toBeInViewport();
  await code.press('Enter');
  await expect(code).not.toBeFocused();
  await expect(code).toHaveValue('test-only');
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByRole('button',{name:'Live routes',exact:true}).click();
  await page.locator('.place-field.destination').click();
  await page.getByLabel('Place name',{exact:true}).fill('Manual destination');
  await page.getByLabel('Longitude',{exact:true}).press('Enter');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.place-field.destination')).toContainText('Manual destination');
});
