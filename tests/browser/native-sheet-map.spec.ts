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

for(const theme of ['dark','light','blue'])test(`confirmation action stays readable in ${theme}`,async({page})=>{
 await page.setViewportSize({width:360,height:800});
 await page.addInitScript(theme=>localStorage.setItem('nightwise.appearance.v1',theme),theme);
 await page.route('https://**/*',r=>r.abort());
 await page.goto('/');
 await page.getByRole('button',{name:'Live routes',exact:true}).click();
 await expect(page.getByRole('button',{name:/Show .* map/})).toHaveCount(0);
 await page.getByRole('button',{name:'Compare night routes'}).click();
 await page.evaluate(()=>{document.documentElement.dataset.nativeMap='true';});
 const button=page.getByRole('button',{name:'Confirm and compare',exact:true});
 await button.scrollIntoViewIfNeeded();
 await expect(button).toBeInViewport();
 const style=await button.evaluate(el=>{
  const s=getComputedStyle(el);const probe=document.createElement('span');
  probe.style.color='var(--accent)';el.append(probe);
  const accent=getComputedStyle(probe).color;probe.remove();
  return {background:s.backgroundColor,color:s.color,accent,height:el.getBoundingClientRect().height,overflow:el.scrollWidth>el.clientWidth};
 });
 expect(style.background).toBe(style.accent);
 expect(style.color).not.toBe(style.background);
 expect(style.height).toBeGreaterThanOrEqual(56);
 expect(style.overflow).toBe(false);
 await expect(page.getByRole('heading',{name:'Confirm your journey'})).toBeInViewport();
 await page.screenshot({path:`test-results/confirmation-${theme}.png`});
});
