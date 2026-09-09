import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs/promises';
const moduleId=process.argv[2]??'M02';
if(!/^M0[23]$/.test(moduleId))throw new Error('Expected M02 or M03');
const out=path.resolve('talks/screenshots',moduleId);await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,reducedMotion:'reduce'});const page=await context.newPage();
 await page.goto('http://127.0.0.1:4173/');await page.getByRole('button',{name:'Compare night routes'}).click();await page.getByRole('radiogroup',{name:'Select a route'}).waitFor();
 await page.screenshot({path:path.join(out,'01-mobile-routes.png'),fullPage:true});
 if(moduleId==='M03'){
  await page.locator('.route-card.selected').getByRole('button',{name:'View activity details'}).click();await page.screenshot({path:path.join(out,'02-evidence.png')});await page.getByRole('button',{name:'Back to routes',exact:true}).click();
  await page.getByRole('button',{name:'Open settings'}).click();await page.getByText('Tutorial scenarios',{exact:true}).click();await page.getByLabel('Preview scenario').selectOption('limited');await page.getByRole('button',{name:'Done',exact:true}).click();await page.getByRole('button',{name:'Compare night routes'}).click();await page.getByRole('radiogroup',{name:'Select a route'}).waitFor();await page.screenshot({path:path.join(out,'03-limited.png'),fullPage:true});
 }
 await context.close();
 const desktop=await browser.newPage({viewport:{width:1360,height:960},deviceScaleFactor:1,reducedMotion:'reduce'});await desktop.goto('http://127.0.0.1:4173/');await desktop.getByRole('button',{name:'Compare night routes'}).click();await desktop.getByRole('radiogroup',{name:'Select a route'}).waitFor();await desktop.screenshot({path:path.join(out,'04-desktop.png'),fullPage:true});
 console.log(`Saved actual ${moduleId} screenshots to ${out}`);
}finally{await browser.close();}
