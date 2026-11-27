import { expect, test } from '@playwright/test';

test('Wheels catalogue loads ten temporary product records with six technical fields', async ({ page }) => {
  await page.goto('/wheels/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle('OURANOS | Wheels');
  await expect(page.locator('#wheels-hero-title')).toContainText('ENGINEERED TO DEFINE');
  await expect(page.locator('.wheel-card')).toHaveCount(10);
  await expect(page.locator('#product-count')).toContainText('10 products');
  await expect(page.locator('.wheel-card').first().locator('.wheel-card__spec')).toHaveCount(6);
  await expect(page.locator('.wheel-card').first().locator('p-icon')).toHaveCount(6);
  await expect(page.locator('.wheel-card').first().locator('p-button')).toHaveCount(2);
  await expect(page.locator('.wheel-card').first()).toContainText('INQUIRE');
  await expect(page.locator('.wheel-card').first()).toContainText('CUSTOMIZE THIS WHEEL');
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
  await page.locator('#filter-mode').evaluate((element) => {
    (element as HTMLSelectElement).value = 'specification';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.locator('#filter-collection').evaluate((element) => {
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

test('Homepage wheel entry points resolve to the Wheels catalogue and its collection filters', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('p-button[href="/wheels/"]').first()).toHaveCount(1);
  await expect(page.locator('p-link-tile[href="/wheels/?collection=performance"]')).toHaveCount(1);
  await expect(page.locator('p-link-tile[href="/wheels/?collection=heritage"]')).toHaveCount(1);
});


test('Vehicle filter uses Wheel Size and transfers the selected fitment into specification filters', async ({ page }) => {
  await page.route('**/api/wheel-size/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.split('/').filter(Boolean).at(-1);
    const payloads: Record<string, unknown> = {
      regions: [{ slug: 'usdm', name: 'United States' }],
      makes: [{ slug: 'bmw', name: 'BMW' }],
      models: [{ slug: '3-series', name: '3 Series' }],
      years: [{ slug: '2024', name: '2024' }],
      modifications: [{ slug: '330i', name: '330i' }],
      'by_model': {
        data: [{
          is_oe: true,
          front: { rim: { diameter: 19, width: 8.5, offset: 25, bolt_pattern: '5x112', center_bore: 66.6 } },
          rear: { rim: { diameter: 19, width: 8.5, offset: 25, bolt_pattern: '5x112', center_bore: 66.6 } },
        }],
      },
    };
    const key = path === 'by_model' ? 'by_model' : path;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payloads[key] ?? { data: [] }) });
  });
  await page.goto('/wheels/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#filter-region')).toBeEnabled();
  await page.locator('#filter-region').evaluate((element) => {
    (element as HTMLSelectElement).value = 'usdm';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#filter-make')).toBeEnabled();
  await page.locator('#filter-make').evaluate((element) => {
    (element as HTMLSelectElement).value = 'bmw';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#filter-model')).toBeEnabled();
  await page.locator('#filter-model').evaluate((element) => {
    (element as HTMLSelectElement).value = '3-series';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#filter-year')).toBeEnabled();
  await page.locator('#filter-year').evaluate((element) => {
    (element as HTMLSelectElement).value = '2024';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#filter-fitment')).toBeEnabled();
  await page.locator('#filter-fitment').evaluate((element) => {
    (element as HTMLSelectElement).value = '0';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#filter-mode')).toHaveJSProperty('value', 'specification');
  await expect(page.locator('#filter-diameter')).toHaveJSProperty('value', '19');
  await expect(page.locator('#filter-width')).toHaveJSProperty('value', '8.5');
  await expect(page.locator('#filter-pcd')).toHaveJSProperty('value', '5x112');
  await expect(page.locator('#filter-offset')).toHaveJSProperty('value', 'ET25');
  await expect(page.locator('#filter-bore')).toHaveJSProperty('value', '66.6');
});
