import {test,expect} from '@playwright/test';

const origin={latitude:13.062827,longitude:77.594089};
const destination={latitude:13.047697,longitude:77.619939};
const routes=[
 {id:'geoapify:fast',label:'Fastest',path:[origin,{latitude:13.059,longitude:77.610},destination],durationSeconds:600,distanceMeters:4000,source:'geoapify',geometryKind:'provider'},
 {id:'geoapify:alt',label:'Alternative',path:[origin,{latitude:13.044,longitude:77.604},destination],durationSeconds:800,distanceMeters:5000,source:'geoapify',geometryKind:'provider'},
];

test('walking journey hands both endpoints and the selected route to each navigation app',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('https://**/*',r=>r.abort());
 let mode='';let calls=0;
 await page.route('**/api/compare',r=>{mode=r.request().postDataJSON().mode;calls++;return r.fulfill({json:{routes,analyses:[],comparison:{version:'sample-activity-v1',fastestId:routes[0].id,selectedId:routes[0].id,recommendedId:null,outcome:'insufficient',message:'Travel times only',commonComponents:[],scores:{}},checkedAt:new Date().toISOString(),activityStatus:'disabled',notices:[],attributions:[],usage:{routeCalls:1,nearbyCalls:0,routeLimit:50,nearbyLimit:500,remainingComparisons:49}}});});
 await page.goto('/');
 await page.getByRole('button',{name:'Live routes',exact:true}).click();
 await page.getByRole('button',{name:'Travel mode: Car'}).click();
 await page.getByRole('option',{name:'Walk Walking routes'}).click();
 await page.getByRole('button',{name:'Compare night routes'}).click();
 await page.getByRole('button',{name:'Confirm and compare'}).click();
 await page.getByRole('radio',{name:'Fastest route',exact:true}).check();
 expect(mode).toBe('WALK');
 await page.getByRole('button',{name:'Continue with this route'}).click();
 const outgoing=async()=>new URL((await page.getByRole('link',{name:'Start navigation',exact:true}).getAttribute('href'))!);
 const fast=await outgoing();
 expect(fast.hostname).toBe('www.google.com');expect(fast.searchParams.get('travelmode')).toBe('walking');
 expect(fast.searchParams.get('origin')).toBe('13.062827,77.594089');expect(fast.searchParams.get('destination')).toBe('13.047697,77.619939');
 expect(fast.searchParams.has('waypoints')).toBe(false);
 await page.getByRole('radio',{name:'Mappls',exact:true}).check();
 const mapplsFast=await outgoing();expect(mapplsFast.searchParams.get('mode')).toBe('walking');expect(mapplsFast.searchParams.get('places')!.split(';')).toHaveLength(5);
 await expect(page.getByRole('dialog')).toContainText('They may appear as stops');
 await page.getByRole('button',{name:'Keep comparing'}).click();
 await page.getByRole('radio',{name:'Alternative 1',exact:true}).check();
 await page.getByRole('button',{name:'Continue with this route'}).click();
 const mapplsAlt=await outgoing();expect(mapplsAlt.searchParams.get('places')).not.toBe(mapplsFast.searchParams.get('places'));
 const points=mapplsAlt.searchParams.get('places')!.split(';');expect(points[0]).toBe('13.062827,77.594089');expect(points.at(-1)).toBe('13.047697,77.619939');
 await page.getByRole('radio',{name:'Google Maps',exact:true}).check();
 const googleAlt=await outgoing();expect(googleAlt.searchParams.get('waypoints')!.split('|')).toEqual(points.slice(1,-1));expect(googleAlt.searchParams.get('travelmode')).toBe('walking');
 expect(calls).toBe(1);
 await page.getByRole('dialog').screenshot({path:'test-results/navigation-handoff.png'});
});

for(const theme of ['dark','light','blue']) test(`travel dropdown fits a narrow phone in ${theme} and supports keyboard selection`,async({page})=>{
 await page.setViewportSize({width:360,height:800});await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(t=>localStorage.setItem('nightwise.appearance.v1',t),theme);
 await page.route('https://**/*',r=>r.abort());await page.goto('/');
 await page.getByRole('button',{name:'Live routes',exact:true}).click();
 const trigger=page.getByRole('button',{name:'Travel mode: Car'});
 await trigger.click();
 const list=page.getByRole('listbox',{name:'Travel mode'});await expect(list).toBeVisible();await list.scrollIntoViewIfNeeded();
 await expect(page.getByRole('option',{name:'Car Driving routes'})).toHaveAttribute('aria-selected','true');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/travel-dropdown-${theme}.png`});
 await list.press('ArrowDown');await list.press('Enter');await expect(page.getByRole('button',{name:'Travel mode: Bike'})).toBeFocused();
 await page.getByRole('button',{name:'Travel mode: Bike'}).press('ArrowDown');await list.press('End');await list.press('Enter');
 await expect(page.getByRole('button',{name:'Travel mode: Walk'})).toBeFocused();
 await page.getByRole('button',{name:'Travel mode: Walk'}).click();await list.press('Escape');await expect(list).toHaveCount(0);
 await page.getByRole('button',{name:'Travel mode: Walk'}).click();await page.getByRole('heading').first().click();await expect(list).toHaveCount(0);
});
