import { test, expect } from '@playwright/test';
test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');});
test('AEOS to Manyata keeps supplied pins and synchronized sample choices',async({page})=>{
  await expect(page.getByRole('button',{name:/FROM AEOS/})).toBeVisible();
  await expect(page.getByRole('button',{name:/TO Manyata Tech Park/})).toBeVisible();
  await page.getByRole('button',{name:'Compare night routes'}).click();
  await expect(page.getByRole('radiogroup',{name:'Select a route'}).getByRole('radio')).toHaveCount(2);
  await page.getByRole('radio',{name:'Fastest',exact:true}).check();
  await expect(page.getByRole('button',{name:'Select Fastest on diagram'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Select Alternative 1 on diagram'}).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('radio',{name:'Alternative 1',exact:true})).toBeChecked();
  await page.getByRole('button',{name:'Continue with this route'}).click();
  const url=new URL((await page.getByRole('link',{name:'Open Google Maps'}).getAttribute('href'))!);
  expect(url.searchParams.get('origin')).toBe('13.062827,77.594089'); expect(url.searchParams.get('destination')).toBe('13.047697,77.619939'); expect(url.searchParams.has('waypoints')).toBe(false);
  await page.getByRole('button',{name:'Keep comparing'}).click(); await expect(page.getByRole('radio',{name:'Alternative 1',exact:true})).toBeChecked();
});
test('destination rejects invalid coordinates without replacing the selected pin',async({page})=>{
  await page.getByRole('button',{name:/TO Manyata/}).click(); await page.getByLabel('Latitude',{exact:true}).fill('1');
  await page.getByRole('button',{name:'Use this pin'}).click(); await expect(page.getByRole('alert')).toContainText('Bengaluru');
  await page.keyboard.press('Escape'); await expect(page.getByRole('button',{name:/TO Manyata/})).toBeVisible();
});
test('zero one and three alternatives are truthful',async({page})=>{
 for(const [value,count] of [['none',0],['one',1],['three',3]] as const){
  await page.getByRole('button',{name:'Open settings'}).click();await page.getByText('Tutorial scenarios',{exact:true}).click();await page.getByLabel('Preview scenario').selectOption(value);await page.getByRole('button',{name:'Done',exact:true}).click();await page.getByRole('button',{name:'Compare night routes'}).click();
  if(!count) await expect(page.getByRole('heading',{name:'No routes in this preview'})).toBeVisible();
  else await expect(page.getByRole('radiogroup',{name:'Select a route'}).getByRole('radio')).toHaveCount(count);
  await page.getByRole('button',{name:'Edit journey',exact:true}).first().click();
 }
});
test('cancellation prevents stale results and sample errors recover',async({page})=>{
 await page.getByRole('button',{name:'Compare night routes'}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.waitForTimeout(600);await expect(page.getByRole('button',{name:'Compare night routes'})).toBeVisible();
 await page.getByRole('button',{name:'Open settings'}).click();await page.getByText('Tutorial scenarios',{exact:true}).click();await page.getByLabel('Preview scenario').selectOption('error');await page.getByRole('button',{name:'Done',exact:true}).click();await page.getByRole('button',{name:'Compare night routes'}).click();
 await expect(page.getByRole('heading',{name:'We couldn’t load routes'})).toBeVisible();await page.getByRole('button',{name:'Retry sample journey'}).click();await expect(page.getByRole('radiogroup',{name:'Select a route'}).getByRole('radio')).toHaveCount(2);
});
