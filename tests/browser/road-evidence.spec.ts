import {test,expect} from '@playwright/test';
test('road evidence feeds the score without exposing road jargon in the UI',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.route('https://**/*',r=>r.abort());
 const checkedAt=new Date().toISOString();
 const analysis={routeId:'google:0',source:'live',checkedAt,distanceMeters:3300,openPlaces:null,closedPlaces:null,unknownHours:null,potentialHelpPoints:null,closingSoon:null,scanCoverage:0,activityCoverage:0,hoursCoverage:0,longestLowActivityMeters:null,longestObservedLowActivityMeters:0,totalLowActivityMeters:null,totalObservedLowActivityMeters:0,longestObservedHelpGapMeters:0,segments:[],places:[],limitations:[],coreComparable:false};
 await page.route('**/api/compare',r=>r.fulfill({json:{routes:[{id:'google:0',label:'Fastest',path:[{latitude:13.0628268,longitude:77.5940888},{latitude:13.047697,longitude:77.619939}],durationSeconds:600,distanceMeters:3300,source:'google',geometryKind:'provider'}],analyses:[analysis],roadAnalyses:{'google:0':{source:'openstreetmap',status:'insufficient',mainMeters:1800,internalMeters:300,unknownMeters:1200,coverage:2100/3300,snapshotDate:'2026-09-09T00:00:00Z'}},comparison:{version:'test',selectedId:'google:0',fastestId:'google:0',recommendedId:null,outcome:'single',message:'Only one route was returned.',commonComponents:[],scores:{}},checkedAt,activityStatus:'disabled',notices:[],attributions:[],usage:{routeCalls:1,nearbyCalls:0,routeLimit:10,nearbyLimit:600,remainingComparisons:9}}}));
 await page.goto('/');await page.getByRole('button',{name:'Live routes',exact:true}).click();await page.getByRole('button',{name:'Compare night routes'}).click();await page.getByRole('button',{name:'Confirm and compare'}).click();
 await expect(page.locator('.activity-score')).toContainText('Based on 1 of 6 signals');
 await page.getByRole('button',{name:'View activity details'}).click();
 await expect(page.getByText('None seen nearby').first()).toBeVisible();
 const breakdown=page.getByRole('region',{name:'Score breakdown'});
 await expect(breakdown).toContainText('Main-road share');
 await expect(page.getByRole('dialog')).not.toContainText('Unclassified distance');
 await expect(page.getByRole('dialog')).not.toContainText('Parallel roads');
 await breakdown.scrollIntoViewIfNeeded();await breakdown.screenshot({path:'talks/screenshots/prebilling/03-road-evidence-mocked.png'});
});
