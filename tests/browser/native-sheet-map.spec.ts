import {test,expect} from '@playwright/test';

test('confirmation map has transparent ancestor surfaces on Android',async({page})=>{
 await page.route('https://**/*',r=>r.abort());
 await page.goto('/');
 await page.getByRole('button',{name:'Live routes',exact:true}).click();
 await page.getByRole('button',{name:'Compare night routes'}).click();
 await expect(page.getByRole('heading',{name:'Confirm your journey'})).toBeVisible();
 await page.evaluate(()=>document.documentElement.dataset.nativeMap='true');
 const covered=await page.locator('.sheet .map-canvas').evaluate(el=>{
   const layers:string[]=[];
   for(let p=el.parentElement;p;p=p.parentElement){const s=getComputedStyle(p);if(s.backgroundColor!=='rgba(0, 0, 0, 0)'&&s.backgroundColor!=='transparent')layers.push(`${p.className}: ${s.backgroundColor}`);}
   return layers;
 });
 expect(covered).toEqual([]);
 await expect(page.getByRole('heading',{name:'Confirm your journey'})).toBeInViewport();
});
