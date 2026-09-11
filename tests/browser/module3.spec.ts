import { test,expect,type Page } from '@playwright/test';
async function selectScenario(page:Page,value:string){await page.getByRole('button',{name:'Open settings'}).click();await page.getByText('Tutorial scenarios',{exact:true}).click();await page.getByLabel('Preview scenario').selectOption(value);await page.getByRole('button',{name:'Done',exact:true}).click();await page.getByRole('button',{name:'Compare night routes'}).click();await page.getByRole('radiogroup',{name:'Select a route'}).waitFor();}
test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');});
test('normal journey shows a calculated tradeoff and consistent route evidence',async({page})=>{
 await page.getByRole('button',{name:'Compare night routes'}).click();
 await expect(page.locator('.evidence-notice')).toHaveAttribute('data-outcome','more-activity');
 await expect(page.locator('.evidence-notice')).toContainText('2 extra minutes');
 await expect(page.getByRole('radio',{name:'Alternative 1',exact:true})).toBeChecked();
 await expect(page.locator('.route-card.selected .activity-score')).toContainText('6/6 signals');
 const summary=await page.locator('.route-card.selected .route-summary').innerText();
 const openCount=summary.match(/^\d+/)?.[0];expect(openCount).toBeTruthy();
 await page.locator('.route-card.selected').getByRole('button',{name:'View activity details'}).click();
 await expect(page.getByRole('dialog')).toContainText('Tutorial mode');
 await expect(page.getByText('Observed places listed as open',{exact:true}).locator('..').locator('dd')).toHaveText(openCount!);
 await expect(page.getByRole('dialog')).toContainText('9 Sep · 8:30 pm IST');
 await expect(page.getByRole('region',{name:'Score breakdown'})).toContainText('6 of 6 signals used');
 await expect(page.getByRole('region',{name:'Score breakdown'}).locator('dl > div')).toHaveCount(6);
 await expect(page.getByRole('region',{name:'Score breakdown'})).toContainText('petrol pumps');
 await expect(page.getByText('Transport locations listed as open',{exact:true}).locator('..').locator('dd')).toHaveText(/\d+/);
 await page.getByRole('region',{name:'Score breakdown'}).screenshot({path:'tmp/browser-regression/M03/six-signal-breakdown.png'});
 await page.getByRole('button',{name:'Back to routes',exact:true}).click();
 await expect(page.getByRole('radio',{name:'Alternative 1',exact:true})).toBeChecked();
});
test('missing and capped evidence never receive an activity recommendation',async({page})=>{
 for(const value of ['limited','unknown','capped']){
  await selectScenario(page,value);await expect(page.locator('.evidence-notice')).toHaveAttribute('data-outcome','insufficient');
  await expect(page.getByRole('radio',{name:'Fastest',exact:true})).toBeChecked();await expect(page.locator('.recommendation-label')).toHaveCount(0);
  await page.locator('.route-card.selected').getByRole('button',{name:'View activity details'}).click();
  await expect(page.getByText('Longest low-activity stretch',{exact:true}).locator('..').locator('dd')).toContainText('uncertain');
  await expect(page.getByRole('dialog')).toContainText('unknown, not low activity');
  if(value==='unknown')await expect(page.getByText('Observed places listed as open',{exact:true}).locator('..').locator('dd')).toHaveText('Unavailable');
  if(value==='capped')await expect(page.getByRole('dialog')).toContainText('result limit');
  await expect.poll(()=>page.locator('.unknown-explanation img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
  await page.getByRole('button',{name:'Back to routes',exact:true}).click();
 }
});
test('ties detours and soon-closing listings keep the fastest selectable',async({page})=>{
 for(const [scenario,outcome] of [['similar','similar'],['detour','detour'],['closing','insufficient']] as const){
  await selectScenario(page,scenario);await expect(page.locator('.evidence-notice')).toHaveAttribute('data-outcome',outcome);await expect(page.getByRole('radio',{name:'Fastest',exact:true})).toBeChecked();
  if(scenario==='closing'){await page.locator('.route-card.selected').getByRole('button',{name:'View activity details'}).click();await expect(page.getByRole('dialog')).toContainText('may close before arrival');await page.getByRole('button',{name:'Back to routes',exact:true}).click();}
  await page.getByRole('radio',{name:'Alternative 1',exact:true}).check();await expect(page.getByRole('button',{name:'Select Alternative 1 on diagram'})).toHaveAttribute('aria-pressed','true');
 }
});
test('results and long evidence remain usable at narrow widths and dark appearance',async({page})=>{
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:900});await selectScenario(page,'three');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.route-card.selected').getByRole('button',{name:'View activity details'}).click();expect(await page.getByRole('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);await page.getByRole('button',{name:'Back to routes',exact:true}).click();
 }
 await page.getByRole('radio',{name:'Alternative 1',exact:true}).check();
 await page.getByRole('button',{name:'Open settings'}).click();await page.getByText('Mono Dark',{exact:true}).click();await page.getByRole('button',{name:'Done',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await expect(page.getByRole('radio',{name:'Alternative 1',exact:true})).toBeChecked();
});
test('local illustrations load and the tutorial makes no provider calls',async({page,baseURL})=>{
 const remote:string[]=[];page.on('request',request=>{if(new URL(request.url()).origin!==new URL(baseURL!).origin)remote.push(request.url());});
 await page.getByRole('button',{name:'About NightWise'}).click();await expect(page.locator('.sheet img')).toBeVisible();expect(await page.locator('.sheet img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);await page.getByRole('button',{name:'Back to NightWise'}).click();await selectScenario(page,'normal');expect(remote).toEqual([]);
});
