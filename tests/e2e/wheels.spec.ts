import { expect, test } from '@playwright/test';

test('Cast wheel collection presents 20 cast references with product and enquiry actions', async ({
  page,
}) => {
  await page.goto('/cast-wheel-collection/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle('OURANOS | Cast wheel Collection');
  await expect(page.locator('.ouranos-header')).toHaveAttribute('data-header-variant', 'overlay');
  await expect(page.locator('#ouranos-ai-open')).toBeVisible();
  await expect(page.locator('body > footer nav[aria-label="Footer"]')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-cast-catalogue-ready', 'true');
  await expect(page.locator('#wheels-grid [data-product]')).toHaveCount(20);
  await expect(page.locator('#product-count')).toHaveText('20 products');
  await expect(page.locator('#wheels-grid p-button')).toHaveCount(40);
  await expect(page.locator('#wheels-grid')).toContainText('ENQUIRE');
  await expect(page.locator('#wheels-grid .wheel-card__image img')).toHaveCount(20);
  await expect(
    page.locator('#wheels-grid .wheel-card__image img').first(),
  ).toHaveAttribute('src', /^https:\/\//);
  await expect(page.locator('#filter-model')).toHaveJSProperty('tagName', 'P-SELECT');
  await expect(page.locator('#filter-diameter')).toHaveJSProperty('tagName', 'P-SELECT');
  await expect(page.locator('#sort-products')).toHaveJSProperty('tagName', 'P-SELECT');
  await expect(
    page.locator('#wheels-grid .wheels-product-card').first(),
  ).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(
    page.locator('#wheels-grid .wheel-card__image').first(),
  ).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(
    page.locator('#wheels-grid .wheel-card__body').first(),
  ).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('#wheels-grid .wheel-card__stock')).toHaveCount(20);
  await expect(page.locator('.wheels-oem')).toContainText('OEM');
  await expect(page.locator('.wheels-oem')).toContainText('ODM');
  await expect(page.locator('.wheels-stock')).toContainText('100-piece minimum order quantity');
  await expect(page.locator('body')).not.toContainText('DEMO');
  await expect(page.locator('body')).not.toContainText('TEMPORARY');
});

test('Cast wheel catalogue filters by model and diameter and remains responsive', async ({
  page,
}) => {
  await page.goto('/cast-wheel-collection/', { waitUntil: 'domcontentloaded' });
  await page.locator('#filter-model').evaluate((el) => {
    el.value = 'SX';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#wheels-grid [data-product]')).toHaveCount(5);
  await page.locator('#filter-diameter').evaluate((el) => {
    el.value = '18';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#wheels-grid [data-product]')).toHaveCount(0);
  await page.locator('#filter-diameter').evaluate((el) => {
    el.value = '17';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#wheels-grid [data-product]')).toHaveCount(5);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#wheels-grid [data-product]')).toHaveCount(5);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
