import {test,expect} from '@playwright/test';
import {sampleRouteOptions} from '../../src/providers/routes';
import {buildQueryPlan,analyzeRoute} from '../../src/domain/activity';
import {compareActivity} from '../../src/domain/comparison';
import {fixtureScans,TUTORIAL_CHECKED_AT} from '../../src/data/activity-fixtures';

test('a partial score shows contributing factors without missing-data badges or expanded points',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('https://**/*',r=>r.abort());
  // Controlled provider-response fixture; no real Bengaluru route was measured.
  const routes=sampleRouteOptions('Manyata Tech Park','normal').map(r=>({...r,source:'geoapify' as const,geometryKind:'provider' as const}));
  const plan=buildQueryPlan(routes),scans=fixtureScans(plan,'normal');
  const analyses=routes.map(r=>analyzeRoute(r,plan,scans,TUTORIAL_CHECKED_AT));
  const comparison=compareActivity(routes,analyses,{}, {allowLive:true});
  expect(comparison.commonComponents).toHaveLength(4);
  await page.route('**/api/compare',r=>r.fulfill({json:{routes,analyses,comparison,checkedAt:TUTORIAL_CHECKED_AT,activityStatus:'complete',notices:[],attributions:[],usage:{routeCalls:1,nearbyCalls:0,routeLimit:10,nearbyLimit:600,remainingComparisons:9}}}));
  await page.goto('/');
  await page.getByRole('button',{name:'Live routes',exact:true}).click();
  await page.getByRole('button',{name:'Compare night routes'}).click();await page.getByRole('button',{name:'Confirm and compare'}).click();
  await expect(page.locator('.route-card.selected .score-display')).toContainText('Activity points · not a safety rating');
  await expect(page.locator('.route-card.selected .score-display')).not.toContainText(/missing|unknown|of 6 signals/i);
  await page.locator('.route-card.selected').getByRole('button',{name:'View activity details'}).click();
  const breakdown=page.getByRole('region',{name:'Score breakdown'});
  await expect(breakdown).not.toContainText(/missing|unknown|of 6 signals/i);
  await expect(breakdown.getByText('Not included',{exact:true})).toHaveCount(0);
  await expect(breakdown.getByText('Distance on main roads',{exact:true})).toHaveCount(0);
  await expect(breakdown).toContainText('A lower score does not mean the road is unsafe');
  await expect(breakdown.getByText('Transport locations listed open',{exact:true}).locator('..').locator('dd')).toHaveText(/\d+\.\d \/ 10 pts/);
});
