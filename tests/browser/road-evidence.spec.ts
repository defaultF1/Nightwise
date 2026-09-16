import {test,expect} from '@playwright/test';
import {buildQueryPlan,analyzeRoute} from '../../src/domain/activity';
import {fixtureScans,TUTORIAL_CHECKED_AT} from '../../src/data/activity-fixtures';
import type {Route} from '../../src/domain/types';

test('road evidence feeds the score without exposing road jargon in the UI',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.route('https://**/*',r=>r.abort());
 const checkedAt=TUTORIAL_CHECKED_AT;
 const route:Route={id:'geoapify:0',label:'Fastest',path:[{latitude:13.0628268,longitude:77.5940888},{latitude:13.047697,longitude:77.619939}],durationSeconds:600,distanceMeters:3300,source:'geoapify',geometryKind:'provider'};
 const plan=buildQueryPlan([route]);const analysis=analyzeRoute(route,plan,fixtureScans(plan,'normal'),checkedAt);
 await page.route('**/api/compare',r=>r.fulfill({json:{routes:[route],analyses:[analysis],roadAnalyses:{'geoapify:0':{source:'openstreetmap',status:'insufficient',mainMeters:1800,internalMeters:300,unknownMeters:1200,coverage:2100/3300,snapshotDate:'2026-09-09T00:00:00Z'}},comparison:{version:'test',selectedId:route.id,fastestId:route.id,recommendedId:null,outcome:'single',message:'Only one route was returned.',commonComponents:[],scores:{}},checkedAt,activityStatus:'complete',notices:[],attributions:[],usage:{routeCalls:1,nearbyCalls:0,routeLimit:10,nearbyLimit:600,remainingComparisons:9}}}));
 await page.goto('/');await page.getByRole('button',{name:'Live routes',exact:true}).click();await page.getByRole('button',{name:'Compare night routes'}).click();await page.getByRole('button',{name:'Confirm and compare'}).click();
 await expect(page.locator('.score-display')).toContainText('Route activity estimate');
 await expect(page.locator('.score-display')).not.toContainText(/missing|unknown|of 6 signals/i);
 await page.getByRole('button',{name:'View activity details'}).click();
 const breakdown=page.getByRole('region',{name:'Score breakdown'});
 await expect(breakdown).toContainText('Distance on main roads');
 await expect(breakdown).toContainText('8.2 / 15 pts');
 await expect(page.getByRole('dialog')).not.toContainText('Unclassified distance');
 await expect(page.getByRole('dialog')).not.toContainText('Parallel roads');
 await breakdown.scrollIntoViewIfNeeded();await breakdown.screenshot({path:'test-results/road-score-v6.png'});
});
