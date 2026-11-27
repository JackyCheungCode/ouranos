import { expect, test } from '@playwright/test';

test('Wheels catalogue loads ten temporary product records with six technical fields', async ({ page }) => {
  await page.goto('/wheels/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle('OURANOS | Wheels');
  await expect(page.locator('#wheels-hero-title')).toContainText('ENGINEERED TO DEFINE');
  await expect(page.locator('.wheel-card')).toHaveCount(10);
  await expect(page.locator('#product-count')).toContainText('10 products');
  await expect(page.locator('.wheel-card').first().locator('.wheel-card__spec')).toHaveCount(6);
  await expect(page.locator('.wheels-demo-note')).toContainText('TEMPORARY APEX TEST DATA');
  await expect(page.locator('body')).not.toContainText('Add to cart');
});

test('Wheels catalogue filters, clears and sorts demo products', async ({ page }) => {
  await page.goto('/wheels/', { waitUntil: 'domcontentloaded' });
  await page.locator('#filter-construction').evaluate((element) => {
    (element as HTMLSelectElement).value = 'Forged';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('.wheel-card')).toHaveCount(10);
  await page.locator('#filter-design').evaluate((element) => {
    (element as HTMLSelectElement).value = 'Eight-Spoke';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('.wheel-card')).toHaveCount(1);
  await expect(page.locator('.wheel-card__title')).toHaveText('SM-8RS');
  await expect(page).toHaveURL(/construction=forged/);
  await page.locator('#clear-filters').click();
  await expect(page.locator('.wheel-card')).toHaveCount(10);
  await page.locator('#sort-products').evaluate((element) => {
    (element as HTMLSelectElement).value = 'az';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('.wheel-card__title').first()).toHaveText('ARC-8RT');
});

test('Wheels mobile filter drawer applies filters and can be dismissed', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/wheels/', { waitUntil: 'domcontentloaded' });
  await page.locator('#mobile-filter-open').click();
  await expect(page.locator('#filter-drawer')).toHaveClass(/is-open/);
  await expect(page.locator('#mobile-filter-apply')).toBeVisible();
  await page.locator('#mobile-collection').evaluate((element) => {
    (element as HTMLSelectElement).value = 'Performance';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.locator('#mobile-filter-apply').click();
  await expect(page.locator('#filter-drawer')).not.toHaveClass(/is-open/);
  await expect(page.locator('.wheel-card')).toHaveCount(3);
});

test('Wheels detail view shows technical specifications and does not invent a GLB', async ({ page }) => {
  await page.goto('/wheels/?model=vs-5rs', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#wheel-detail')).toBeVisible();
  await expect(page.locator('#detail-title')).toHaveText('VS-5RS');
  await expect(page.locator('#detail-specs')).toContainText('5 × 120');
  await expect(page.locator('.wheel-detail__viewer')).toContainText('3D MODEL NOT AVAILABLE');
  await expect(page.locator('.wheel-detail__viewer')).not.toContainText('canvas');
});
