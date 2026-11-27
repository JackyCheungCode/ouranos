import { expect, test } from '@playwright/test';
test('Lead time estimator generates casting and forging schedules with 36 lines',async({page})=>{
 await page.route('**/api/lead-time/simulate',async route=>{
  const body=route.request().postDataJSON();const start=new Date(body.orderDate+'T00:00:00');while(start.getDay()===0||start.getDay()===6)start.setDate(start.getDate()+1);
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({process:body.process,startDate:start.toISOString().slice(0,10),selectedLine:'LINE-01',lines:Array.from({length:36},(_,i)=>({id:'LINE-'+String(i+1).padStart(2,'0'),product:'VS-5RS',phase:'CNC MACHINING',startOffset:i%8,duration:body.process==='casting'?8:7}))})});
 });
 await page.goto('/lead-time/');await expect(page).toHaveTitle('OURANOS | Lead Time Estimator');await expect(page.locator('#lead-product p-select-option')).toHaveCount(11);
 await page.locator('#lead-product').evaluate(el=>{el.value='vs-5rs';el.dispatchEvent(new Event('change',{bubbles:true}));});await page.locator('#lead-submit').click();
 await expect(page.locator('#production-results')).toBeVisible();await expect(page.locator('#gantt-chart .gantt-row')).toHaveCount(36);await expect(page.locator('.stage-card')).toHaveCount(7);await expect(page.locator('#result-process')).toHaveText('CASTING');
 await page.locator('input[name="process"][value="forging"]').check();await page.locator('#lead-submit').click();await expect(page.locator('#result-process')).toHaveText('FORGING');await expect(page.locator('#twin-process-label')).toContainText('FORGING');await expect(page.locator('#gantt-chart .gantt-row')).toHaveCount(36);
});
