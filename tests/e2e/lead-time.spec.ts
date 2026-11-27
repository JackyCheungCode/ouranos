import { expect, test } from '@playwright/test';

test('Lead time estimator presents a focused customer estimate and manufacturing journey', async ({ page }) => {
  await page.route('**/api/lead-time/simulate', async (route) => {
    const body = route.request().postDataJSON();
    const today = new Date();
    const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const requested = new Date(body.orderDate + 'T00:00:00Z');
    const addWorkdays = (date: Date, count: number) => {
      const result = new Date(date);
      let added = 0;
      while (added < count) {
        result.setUTCDate(result.getUTCDate() + 1);
        if (result.getUTCDay() !== 0 && result.getUTCDay() !== 6) added += 1;
      }
      return result;
    };
    const start = requested > todayUtc ? requested : addWorkdays(todayUtc, 1);
    while (start.getUTCDay() === 0 || start.getUTCDay() === 6) start.setUTCDate(start.getUTCDate() + 1);
    const addWorkdayDate = (date: Date, count: number) => addWorkdays(date, count).toISOString().slice(0, 10);
    const stages = [
      { name: 'Order and material preparation', durationDays: 1, startDate: start.toISOString().slice(0, 10), endDate: start.toISOString().slice(0, 10) },
      { name: 'Forging and forming', durationDays: 2, startDate: addWorkdayDate(start, 1), endDate: addWorkdayDate(start, 2) },
      { name: 'CNC machining', durationDays: 2, startDate: addWorkdayDate(start, 3), endDate: addWorkdayDate(start, 4) },
      { name: 'Surface finishing', durationDays: 1, startDate: addWorkdayDate(start, 5), endDate: addWorkdayDate(start, 5) },
      { name: 'Quality inspection', durationDays: 1, startDate: addWorkdayDate(start, 6), endDate: addWorkdayDate(start, 6) },
    ];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'simulated', process: 'forging', productId: body.productId, quantity: body.quantity,
        startDate: start.toISOString().slice(0, 10), completionDate: stages[4].endDate, targetWorkingDays: 7,
        baseWorkingDays: 7, quantityAdjustmentDays: 0, stages,
        assumptions: { standardBatchSize: 8, workingWeek: 'Monday-Friday', liveCapacityConnected: false },
      }),
    });
  });

  await page.goto('/lead-time/');
  await expect(page).toHaveTitle('OURANOS | Production Lead Time');
  await expect(page.locator('#lead-product p-select-option')).toHaveCount(11);
  await expect(page.locator('input[name="process"]')).toHaveCount(0);
  await expect(page.locator('#production-results')).toBeHidden();
  await expect(page.locator('#ouranos-ai-panel')).toBeHidden();
  await expect(page.locator('body > footer')).toBeVisible();
  await expect(page.locator('#nav-drilldown')).toHaveCount(1);
  await expect(page.locator('#gantt-chart')).toHaveCount(0);
  await expect(page.locator('#loading-steps')).toContainText('Reviewing wheel configuration');
  await expect(page.locator('#loading-steps')).not.toContainText('MES');

  await page.locator('#lead-product').evaluate((element) => {
    element.value = 'vs-5rs';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#product-detail')).toContainText('Split-Spoke');
  await page.locator('#lead-submit').click();
  await expect(page.locator('#lead-loading')).toBeVisible();
  await expect(page.locator('#loading-steps li').first()).toHaveClass(/is-active/);
  await expect(page.locator('#production-results')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#result-duration')).toHaveText('7');
  await expect(page.locator('#result-quantity')).toHaveText('4 WHEELS');
  await expect(page.locator('#production-journey li')).toHaveCount(5);
  await expect(page.locator('#production-journey')).toContainText('Quality inspection');
  await expect(page.locator('.estimate-disclaimer')).toContainText('not a live factory-capacity confirmation');
  await expect(page.locator('#gantt-chart')).toHaveCount(0);
});
