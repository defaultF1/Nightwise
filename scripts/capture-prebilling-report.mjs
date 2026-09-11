import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await page.route('https://**/*',r=>r.abort());
 await page.route('**/api/status',r=>r.fulfill({json:{ready:false,paused:true,searchEnabled:false,activityEnabled:false}}));
 await page.goto('http://127.0.0.1:4173/');await page.locator('.place-field.destination').click();await page.getByLabel('Search places').fill('Airport');await page.getByRole('button',{name:'Search Bengaluru'}).click();await page.getByRole('status').waitFor();
 const box=await page.getByRole('dialog').boundingBox(),notice=await page.getByRole('status').boundingBox();
 await page.screenshot({path:'talks/screenshots/prebilling/01-place-search-report.png',clip:{x:box.x,y:box.y,width:box.width,height:notice.y+notice.height-box.y+16}});
 console.log('Captured the relevant visible search controls and paused notice; provider calls mocked.');
}finally{await browser.close();}
