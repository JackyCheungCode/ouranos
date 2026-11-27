import { expect, test } from '@playwright/test';
test('Lead time estimator runs MES loading and renders a 36-line Gantt schedule', async ({ page }) => {
  await page.route('**/api/lead-time/simulate', async (route) => {
    const body = route.request().postDataJSON();
    const start = new Date(body.orderDate + 'T00:00:00');
    while (start.getDay() === 0 || start.getDay() === 6) start.setDate(start.getDate() + 1);
    const stages = ['ORDER PREPARATION','MATERIAL ALLOCATION','RAW MATERIAL','PRIMARY FORMING','CNC MACHINING','SURFACE FINISH','QUALITY CONTROL'];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      process: 'forging', startDate: start.toISOString().slice(0,10), selectedLine: 'LINE-01', targetWorkingDays: 7,
      lines: Array.from({length:36},(_,i)=>({id:'LINE-'+String(i+1).padStart(2,'0'),product:'ORDER-'+String(i+1).padStart(3,'0'),startOffset:i===0?1:-22+i%22,duration:7,orderColor:'hsl('+i*20+' 27% 43%)',segments:stages.map((name,n)=>({name,offset:n,duration:1,category:n<2?'prep':n<5?'process':'finish'}))}))
    })});
  });
  await page.goto('/lead-time/');
  await expect(page).toHaveTitle('OURANOS | Lead Time Estimator');
  await expect(page.locator('#lead-product p-select-option')).toHaveCount(11);
  await expect(page.locator('input[name="process"]')).toHaveCount(0);
  await expect(page.locator('#production-results')).toBeHidden();
  await page.locator('#lead-product').evaluate((el) => { el.value='vs-5rs'; el.dispatchEvent(new Event('change',{bubbles:true})); });
  await page.locator('#lead-submit').click();
  await expect(page.locator('#lead-loading')).toBeVisible();
  await expect(page.locator('#loading-steps li').first()).toHaveClass(/is-active/);
  await expect(page.locator('#production-results')).toBeVisible({timeout:15000});
  await expect(page.locator('#gantt-chart .gantt-row')).toHaveCount(36);
  await expect(page.locator('#gantt-chart .gantt-bar')).toHaveCount(203);
  await expect(page.locator('.stage-card')).toHaveCount(0);
  await expect(page.locator('#gantt-chart .gantt-bar.is-customer')).toHaveCount(7);
});
