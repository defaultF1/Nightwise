import {test,expect} from '@playwright/test';
import {analyzeComparison} from '../../src/domain/analyze-comparison';
import {fixtureScans,fixtureRoadEvidence,TUTORIAL_CHECKED_AT} from '../../src/data/activity-fixtures';
import {sampleRouteOptions} from '../../src/providers/routes';
function response(){
 const samples=sampleRouteOptions('AEOS','normal');const result=analyzeComparison(samples,p=>fixtureScans(p,'normal'),TUTORIAL_CHECKED_AT,fixtureRoadEvidence(samples,'normal'));
 const analyses=result.analyses.map(a=>({...a,source:'live',activityCoverage:.21,coreComparable:false,distanceMeters:1000,segments:[{fromMeters:0,toMeters:210,state:'active'},{fromMeters:210,toMeters:1000,state:'unknown'}],places:[{...a.places[0],id:'unknown-shop',name:'Example unknown shop',hours:{state:'unknown',closingSoon:false,minutesUntilClose:null,reason:'Google did not return usable opening and closing times.'},schedule:undefined},{...a.places[0],name:'Example pharmacy',hours:{state:'closed',closingSoon:false,minutesUntilClose:null,basis:'current'},schedule:{currentWeek:['Wednesday: Closed'],regularWeek:['Monday: 9:00 AM – 10:00 PM','Wednesday: 10:00 AM – 9:00 PM'],specialDates:['2026-09-09'],nextOpenTime:'2026-09-10T03:30:00Z'}}]}));
 return {routes:samples.map(r=>({...r,source:'google',geometryKind:'provider'})),analyses,comparison:{...result.comparison,scores:{},recommendedId:null,outcome:'insufficient'},checkedAt:TUTORIAL_CHECKED_AT,activityStatus:'partial',notices:[],attributions:[],usage:{remainingComparisons:1}};
}
test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({json:r.request().url().endsWith('/compare')?response():{ready:true}}));await page.goto('/');await page.getByRole('button',{name:'Live routes',exact:true}).click();await page.getByRole('button',{name:'Compare night routes'}).click();await page.getByRole('button',{name:'Confirm and compare'}).click();});
test('explains incomplete coverage and lets users learn the three patterns',async({page})=>{
 const strip=page.locator('.activity-strip').first();await expect(strip).toContainText('21% checked for activity');await expect(page.locator('.route-disclaimer')).toContainText('not a safety rating');await strip.getByText('How does this help me choose?').click();await expect(strip).toContainText('This does not mean the road is empty.');await expect(strip.getByText('Destination',{exact:true})).toBeVisible();
 await page.setViewportSize({width:320,height:800});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await strip.scrollIntoViewIfNeeded();await page.screenshot({path:'talks/screenshots/hours-explanation/coverage-browser.png'});
});
test('shows regular schedules and special-day information without extra requests',async({page})=>{
 await page.getByText('Shop opening times and closed days',{exact:true}).click();await page.locator('.shop-hours-item summary').filter({hasText:'Example pharmacy'}).click();await expect(page.getByText('Wednesday: 10:00 AM – 9:00 PM',{exact:true})).toBeVisible();await expect(page.getByText('Wednesday: Closed',{exact:true})).toBeVisible();await expect(page.getByText('Listed closed when you pass',{exact:true})).toBeVisible();await expect(page.locator('.shop-hours')).toContainText('2026-09-09');await page.locator('.shop-hours').scrollIntoViewIfNeeded();await page.screenshot({path:'talks/screenshots/hours-explanation/schedules-browser.png'});
});

test('missing hours use a labelled planning estimate without claiming confirmed opening',async({page})=>{
 await page.getByText('Shop opening times and closed days',{exact:true}).click();
 const item=page.locator('.shop-hours-item').filter({hasText:'Example unknown shop'});
 await expect(item).toContainText('Assumed hours: 9 am–8 pm IST');
 await item.locator('summary').click();await expect(item).toContainText('Weekly closures and holidays are unknown');await expect(item).toContainText('Not counted as confirmed open');
 await item.screenshot({path:'tmp/browser-regression/M06/assumed-hours.png'});
});
