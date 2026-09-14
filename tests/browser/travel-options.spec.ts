import {test,expect} from '@playwright/test';
test('mode and departure controls send the selected journey without live Google calls',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('https://**/*',r=>r.abort());
 let payload:any;
 await page.route('**/api/compare',r=>{payload=r.request().postDataJSON();return r.fulfill({status:503,json:{message:'Offline test completed'}});});
 await page.goto('/');
 await page.getByRole('button',{name:'Live routes',exact:true}).click();
 await page.getByLabel('Travel mode').selectOption('WALK');
 await page.getByLabel('Departure time').selectOption('300');
 await page.getByRole('button',{name:'Compare night routes'}).click();
 await page.getByRole('button',{name:'Confirm and compare'}).click();
 await expect.poll(()=>payload?.mode).toBe('WALK');
 expect(Date.parse(payload.departureTime)-Date.now()).toBeGreaterThan(290*60_000);
 expect(Date.parse(payload.departureTime)-Date.now()).toBeLessThanOrEqual(300*60_000);
});
for(const theme of ['dark','light','blue'])test(`score ring fits a phone in ${theme}`,async({page})=>{
 await page.setViewportSize({width:360,height:800});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(t=>localStorage.setItem('nightwise.appearance.v1',t),theme);
 await page.route('https://**/*',r=>r.abort());
 await page.goto('/');await page.getByRole('button',{name:'Compare night routes'}).click();
 const ring=page.locator('.score-ring').first();await expect(ring).toBeVisible();
 await ring.scrollIntoViewIfNeeded();
 expect(await page.locator('.score-progress').first().evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/score-ring-${theme}.png`});
});
