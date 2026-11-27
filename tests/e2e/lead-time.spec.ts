import { expect, test } from '@playwright/test';
test('Lead time estimator shows a customer-focused estimate without production line data', async ({ page }) => {
  await page.route('**/api/lead-time/simulate', async (route) => {
    const body = route.request().postDataJSON();
    const start = new Date(body.orderDate + 'T00:00:00');
    while (start.getDay() === 0 || start.getDay() === 6) start.setDate(start.getDate() + 1);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ source:'simulated', process:'forging', startDate:start.toISOString().slice(0,10), targetWorkingDays:7, productId:body.productId, quantity:body.quantity }) });
  });
  await page.goto('/lead-time/');
  await expect(page).toHaveTitle('OURANOS | Lead Time Estimator');
  await expect(page.locator('#lead-product p-select-option')).toHaveCount(11);
  await expect(page.locator('input[name="process"]')).toHaveCount(0);
  await expect(page.locator('#production-results')).toBeHidden();
  await expect(page.locator('#ouranos-ai-panel')).toBeHidden();
  await expect(page.locator('body > footer')).toBeVisible();
  await expect(page.locator('#nav-drilldown')).toHaveCount(1);
  await expect(page.locator('#gantt-chart')).toHaveCount(0);
  await page.locator('#lead-product').evaluate((el) => { el.value='vs-5rs'; el.dispatchEvent(new Event('change',{bubbles:true})); });
  await page.locator('#lead-submit').click();
  await expect(page.locator('#lead-loading')).toBeVisible();
  await expect(page.locator('#loading-steps li').first()).toHaveClass(/is-active/);
  await expect(page.locator('#production-results')).toBeVisible({timeout:15000});
  await expect(page.locator('#result-duration')).toHaveText('7 WORKING DAYS');
  await expect(page.locator('#gantt-chart')).toHaveCount(0);
  await expect(page.locator('.stage-card')).toHaveCount(0);
});
