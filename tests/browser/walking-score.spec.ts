import {test,expect} from '@playwright/test';
import type {ActivityAnalysis} from '../../src/domain/activity-types';

test('busy walking routes have distinct bounded scores without missing-data labels',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('https://**/*',r=>r.abort());
 const checkedAt='2026-09-16T12:00:00+05:30';
 const origin={latitude:13.062827,longitude:77.594089},destination={latitude:13.047697,longitude:77.619939};
 const routes=['spread','cluster'].map((id,i)=>({id:`geoapify:${id}`,label:id,path:[origin,destination],durationSeconds:600+i*60,distanceMeters:1000,source:'geoapify',geometryKind:'provider'}));
 const analyses:ActivityAnalysis[]=routes.map((route,j)=>({routeId:route.id,source:'live',checkedAt,distanceMeters:1000,scanCoverage:1,hoursCoverage:0,activityCoverage:0,openPlaces:0,closedPlaces:0,unknownHours:24,potentialHelpPoints:0,staffedPlaceProxy:0,openTransportPoints:0,closingSoon:0,longestHelpGapMeters:null,longestObservedHelpGapMeters:1000,longestLowActivityMeters:null,longestObservedLowActivityMeters:1000,lowActivityOpenThreshold:2,totalLowActivityMeters:null,totalObservedLowActivityMeters:1000,segments:Array.from({length:5},(_,i)=>({fromMeters:i*200,toMeters:(i+1)*200,state:'unknown'})),places:Array.from({length:24},(_,i)=>({id:`shop:${i}`,coordinate:origin,name:`Shop ${i}`,categories:['store'],sampleIndexes:[j===0?i%6:0],conflict:false,arrivalMinutes:0,hours:{state:'unknown',closingSoon:false,minutesUntilClose:null,reason:'Opening and closing times were not provided.'}})),limitations:[],coreComparable:false}));
 await page.route('**/api/compare',r=>r.fulfill({json:{routes,analyses,comparison:{version:'fixture',selectedId:routes[0].id,fastestId:routes[0].id,recommendedId:null,outcome:'insufficient',message:'Planning estimate',commonComponents:[],scores:{},componentScores:{},rankedIds:[]},checkedAt,activityStatus:'complete',notices:[],attributions:[],usage:{routeCalls:1,nearbyCalls:0,routeLimit:50,nearbyLimit:500,remainingComparisons:49}}}));
 await page.goto('/');await page.getByRole('button',{name:'Live routes',exact:true}).click();
 await page.getByRole('group',{name:'Travel mode'}).getByRole('button',{name:'Walk',exact:true}).click();
 await page.getByRole('button',{name:'Compare night routes'}).click();await page.getByRole('button',{name:'Confirm and compare'}).click();
 const scores=page.locator('.route-card .score-ring b');await expect(scores).toHaveCount(2);
 const values=(await scores.allTextContents()).map(Number);expect(values.every(v=>v>0&&v<60)).toBe(true);expect(new Set(values).size).toBe(2);
 for(const card of await page.locator('.route-card .score-display').all())await expect(card).not.toContainText(/missing|unknown|of 6 signals/i);
 await page.locator('.route-card.selected').screenshot({path:'test-results/walking-score-v6.png'});
 await page.locator('.route-card.selected').getByRole('button',{name:'View activity details'}).click();
 const breakdown=page.getByRole('region',{name:'Score breakdown'});
 await expect(breakdown).not.toContainText(/missing|unknown|of 6 signals/i);
 await expect(breakdown).toContainText('/ 25 pts');
 const cameras=breakdown.locator('.evidence-rows > div').filter({has:page.locator('dt',{hasText:'Mapped cameras along the route'})});
 await expect(cameras.locator('dd')).toHaveText(/\d+\.\d \/ 10 pts/);
 await expect(cameras).toContainText('eligible mapped camera sites');
 await breakdown.getByText('How the score works',{exact:true}).click();await expect(breakdown).toContainText('35% credit');
 await breakdown.screenshot({path:'test-results/walking-score-breakdown-v6.png'});
});
