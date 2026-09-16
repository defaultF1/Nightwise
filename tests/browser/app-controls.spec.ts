import {test,expect} from '@playwright/test';
for(const theme of ['light','dark','blue'])test(`all journey dropdowns align and work on a 360px phone in ${theme}`,async({page})=>{
 await page.setViewportSize({width:360,height:800});await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(theme=>localStorage.setItem('nightwise.appearance.v1',theme),theme);
 await page.route('https://**/*',r=>r.abort());await page.goto('/');
 await page.getByRole('button',{name:'Live routes',exact:true}).click();
 const travel=page.getByRole('group',{name:'Travel mode'}),departure=page.getByRole('button',{name:'Departure time: Leave now'});
 const a=await travel.boundingBox(),b=await departure.boundingBox();expect(a&&b).toBeTruthy();expect(a!.y).toBeCloseTo(b!.y,0);expect(a!.height).toBe(b!.height);expect(a!.width).toBeCloseTo(b!.width,0);
 await departure.click();const list=page.getByRole('listbox',{name:'Departure time'});await expect(list).toBeVisible();await list.press('End');await list.press('Enter');
 await expect(page.getByRole('button',{name:/^Departure time: \d/})).toBeFocused();
 const afterTravel=await travel.boundingBox(),afterDeparture=await page.getByRole('button',{name:/^Departure time: \d/}).boundingBox();expect(afterTravel!.height).toBe(afterDeparture!.height);
 await page.getByRole('button',{name:/^Extra travel time:/}).click();await page.getByRole('option',{name:'Up to 20 extra minutes',exact:true}).click();
 expect(await page.evaluate(()=>localStorage.getItem('nightwise.extraMinutes'))).toBe('20');
 await expect(page.locator('select')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.plan-card').screenshot({path:`test-results/journey-controls-${theme}.png`});
 await page.getByRole('button',{name:'Open settings'}).click();await page.getByText('Tutorial scenarios',{exact:true}).click();
 await page.getByRole('button',{name:/^Preview scenario:/}).click();await page.getByRole('listbox',{name:'Preview scenario'}).press('Escape');await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('button',{name:/^Preview scenario:/}).click();await page.getByRole('option',{name:'Three route options',exact:true}).click();
 await expect(page.getByRole('button',{name:'Preview scenario: Three route options'})).toBeVisible();await expect(page.getByRole('dialog')).toBeVisible();
});

for(const apps of [[],['mappls'],['google'],['google','mappls']])test(`Android dropdown only lists installed supported apps: ${apps.join(',')||'none'}`,async({page})=>{
 await page.setViewportSize({width:360,height:800});await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(apps=>{
  const win=window as any;win.CapacitorCustomPlatform={name:'android'};
  const methods:Record<string,string[]>={MapsHandoff:['available','open'],DeviceSettings:['installationStamp'],MapViewport:['background'],Preferences:['get','set','remove'],StatusBar:['setStyle','setBackgroundColor'],App:['addListener','removeListener','minimizeApp']};
  win.installedMaps=apps;win.nativeCalls=[];
  win.Capacitor={PluginHeaders:Object.entries(methods).map(([name,methods])=>({name,methods:methods.map(name=>({name,rtype:'promise'}))})),nativePromise:async(plugin:string,method:string,options:any)=>{
   if(plugin==='MapsHandoff'&&method==='available')return {apps:win.installedMaps};
   if(plugin==='MapsHandoff'&&method==='open'){win.nativeCalls.push(options);return {};}
   if(plugin==='Preferences'&&method==='get')return {value:options.key==='nightwise.appearance.v1'?'light':null};
   if(method==='installationStamp')return {stamp:'test-install'};
   return {};
  }};
 },apps);
 await page.route('https://**/*',r=>r.abort());await page.goto('/');await page.getByRole('button',{name:'Compare night routes'}).click();await page.getByRole('button',{name:'Continue with this route'}).click();
 const names:Record<string,string>={google:'Google Maps',mappls:'Mappls'};
 if(apps.length){
  await page.getByRole('button',{name:/^Navigate with:/}).click();
  await expect(page.getByRole('option')).toHaveCount(apps.length);
  for(const [id,name] of Object.entries(names))await expect(page.getByRole('option',{name,exact:true})).toHaveCount(apps.includes(id)?1:0);
  await page.getByRole('option',{name:names[apps.at(-1)!],exact:true}).click();
  await page.getByRole('link',{name:'Start navigation',exact:true}).click();
  const calls=await page.evaluate(()=>(window as any).nativeCalls);expect(calls).toHaveLength(1);expect(calls[0].url).toContain(apps.at(-1)==='mappls'?'mappls.com/direction':'google.com/maps/dir/');
  // A fresh check removes a previously selected app after uninstall.
  await page.evaluate(()=>{(window as any).installedMaps=[];window.dispatchEvent(new Event('nightwise:refresh-navigation-apps'));});
 }
 await expect(page.getByRole('button',{name:/^Navigate with:/})).toHaveCount(0);
 await expect(page.getByRole('link',{name:'Open directions in browser'})).toBeVisible();
 await page.getByRole('button',{name:'Keep comparing'}).scrollIntoViewIfNeeded();await expect(page.getByRole('button',{name:'Keep comparing'})).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('dialog').screenshot({path:`test-results/navigation-installed-${apps.join('-')||'none'}.png`});
});
