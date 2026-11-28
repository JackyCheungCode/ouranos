import { expect, test } from '@playwright/test';

test('forged wheel collection renders 20 BBS visual references with one shared customisation programme', async ({
  page,
}) => {
  await page.goto('/forged-wheels/collection/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle('OURANOS | Forged Wheel Collection');
  await expect(page.locator('.ouranos-header')).toHaveAttribute('data-header-variant', 'overlay');
  await expect(page.locator('#ouranos-ai-open')).toBeVisible();
  await expect(page.locator('#ouranos-language-trigger')).toHaveCount(0);
  await expect(page.locator('.ouranos-header__video')).toBeVisible();
  await expect(page.locator('.ouranos-header__video source')).toHaveAttribute(
    'src',
    '/videos/mood-porsche-gts.mp4',
  );
  await expect(page.locator('body > footer')).toBeVisible();
  await expect(page.locator('body > footer nav[aria-label="Footer"]')).toBeVisible();

  await expect(page.locator('#collection-hero-title')).toContainText('Forged for your vision.');
  await expect(page.locator('.forged-customisation-item')).toHaveCount(4);
  await expect(page.locator('.forged-customisation-item').nth(0)).toContainText('Diameter · Width');
  await expect(page.locator('.forged-customisation-item').nth(1)).toContainText('ET · PCD · CB');
  await expect(page.locator('.forged-customisation-item').nth(2)).toContainText('Finish · Color');
  await expect(page.locator('.forged-customisation-item').nth(3)).toContainText(
    'Center Cap · Engraving',
  );

  await expect(page.locator('.forged-product-card')).toHaveCount(20);
  await expect(page.locator('#product-count')).toHaveText('20 models');
  await expect(page.locator('.forged-product-card p-button')).toHaveCount(40);
  await expect(page.locator('.forged-product-card').first()).not.toContainText('Wheel dimensions');
  await expect(page.locator('.forged-product-card').first()).not.toContainText('Center Cap');
  await expect(page.locator('.forged-reference-note')).toContainText('not OURANOS products');

  await expect(
    page.locator('.forged-product-card').first().locator('p-button').first(),
  ).toHaveAttribute('href', /^https:\/\/bbs-japan\.co\.jp\/en\/products\//);
  await expect(
    page.locator('.forged-product-card').first().locator('p-button').nth(1),
  ).toHaveAttribute('href', /reference=BBS%20FL/);
});

test('forged collection filters and sorts the reference models', async ({ page }) => {
  await page.goto('/forged-wheels/collection/', { waitUntil: 'domcontentloaded' });

  await page.locator('#filter-construction').evaluate((element) => {
    (element as HTMLSelectElement).value = 'Two-Piece';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('.forged-product-card')).toHaveCount(6);
  await expect(page.locator('#product-count')).toHaveText('6 models');

  await page.locator('#filter-design').evaluate((element) => {
    (element as HTMLSelectElement).value = 'Cross-Spoke';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('.forged-product-card')).toHaveCount(2);

  await page.locator('#clear-filters').click();
  await expect(page.locator('.forged-product-card')).toHaveCount(20);

  await page.locator('#sort-products').evaluate((element) => {
    (element as HTMLSelectElement).value = 'az';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('.forged-product-card h3').first()).toHaveText('FI-R');
});

test('forged collection remains responsive without horizontal overflow', async ({ page }) => {
  for (const width of [1440, 1024, 600, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/forged-wheels/collection/', { waitUntil: 'domcontentloaded' });

    const layout = await page.evaluate(() => ({
      columns: getComputedStyle(document.querySelector('#forged-products-grid')!)
        .gridTemplateColumns.trim()
        .split(/\s+/).length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    }));
    const expectedColumns = width > 1100 ? 4 : width > 760 ? 3 : width > 420 ? 2 : 1;
    expect(layout.columns, 'grid columns at ' + width + 'px').toBe(expectedColumns);
    expect(layout.overflow, 'horizontal overflow at ' + width + 'px').toBe(false);
    await expect(page.locator('.forged-product-card')).toHaveCount(20);
  }
});