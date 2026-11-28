import { expect, test } from '@playwright/test';

test('wheel product detail resolves a forged product and connects the enquiry flow', async ({ page }) => {
  await page.goto('/wheel-product/?type=forged&id=fl', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.ouranos-header')).toBeVisible();
  await expect(page.locator('main.product-detail-shell')).toBeVisible();
  await expect(page.locator('#product-title')).toHaveText('FL');
  await expect(page.locator('#product-enquire')).toHaveAttribute('href', /wheel-enquiry/);
  await expect(page.locator('#product-fitment')).toHaveAttribute('href', /fitment-guide/);
  await expect(page.locator('#product-specs .spec-cell')).toHaveCount(6);
});

test('wheel product detail resolves a cast product', async ({ page }) => {
  await page.goto('/wheel-product/?type=cast&id=sr-009', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#product-title')).toHaveText('SR 009');
  await expect(page.locator('#product-kicker')).toContainText('CAST');
});

test('wheel enquiry form submits through the existing inquiry endpoint contract', async ({ page }) => {
  await page.goto('/wheel-enquiry/?type=forged&id=fl&model=FL', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#wheel-enquiry-form')).toBeVisible();
  await expect(page.locator('input[name="product_id"]')).toHaveValue('fl');
  await expect(page.locator('input[name="quantity"]')).toHaveValue('4');
  await expect(page.locator('.ouranos-header')).toBeVisible();
});

test('fitment engineering report and technical support pages render shared site layout', async ({ page }) => {
  await page.goto('/fitment-report/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('p-heading[tag="h1"]')).toContainText('Fitment is a system');
  await expect(page.locator('.report-access__levels article')).toHaveCount(2);
  await expect(page.locator('body > footer')).toBeVisible();
  await page.goto('/technical-support/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.faq-list details')).toHaveCount(9);
  await expect(page.locator('#nav-drilldown')).toContainText('Technical Support / FAQ');
  await expect(page.locator('body > footer')).toBeVisible();
});
