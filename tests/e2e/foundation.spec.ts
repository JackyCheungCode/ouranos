import { expect, test } from '@playwright/test';

test('Home page is served at the root with shared Ouranos layout', async ({ page, request }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveTitle('Ouranos | Home');
  await expect(page.locator('p-heading#heading-section-1')).toContainText('Home');
  await expect(page.locator('header a[aria-label="Ouranos Home"]').first()).toHaveText('OURANOS');
  await expect(page.locator('#nav-drilldown')).toHaveCount(1);
  await expect(page.locator('footer')).toContainText('Ouranos');

  const visibleText = await page.locator('body').innerText();
  expect(visibleText).not.toMatch(/Porsche/i);
  await expect(page.locator('p-wordmark, p-crest')).toHaveCount(0);

  const stylesheet = page.locator('link[rel="stylesheet"]').first();
  await expect(stylesheet).toHaveAttribute('href', /\\.css(?:\\?|$)/);
  const stylesheetUrl = await stylesheet.getAttribute('href');
  expect(stylesheetUrl).not.toBeNull();

  const cssResponse = await request.get(new URL(stylesheetUrl!, page.url()).toString());
  expect(cssResponse.ok()).toBeTruthy();
  expect(await cssResponse.text()).toContain('--pds-');
  expect(pageErrors).toEqual([]);
});

test('Home exposes the two primary entry tiles and five wheel collections', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('p-link-tile[label="Find Wheels for Your Vehicle"]')).toHaveAttribute(
    'href',
    '/fitment',
  );
  await expect(page.locator('p-link-tile[label="Customize Your Wheels"]')).toHaveAttribute(
    'href',
    '/customize',
  );

  for (const line of ['PERFORMANCE', 'LUXURY', 'STREET', 'OFF-ROAD', 'HERITAGE']) {
    await expect(page.locator(`p-link-tile[label="${line}"]`)).toHaveCount(1);
  }

  await expect(page.locator('p-carousel p-link-tile')).toHaveCount(5);
});

test('Home header icons and collection tile foregrounds are white', async ({ page }) => {
  await page.goto('/');

  const headerIconColor = await page
    .locator('header p-button-pure')
    .first()
    .evaluate((element) => getComputedStyle(element).color);
  const collectionTextColor = await page
    .locator('p-link-tile[label="PERFORMANCE"]')
    .evaluate((element) => getComputedStyle(element).color);

  expect(headerIconColor).toBe('rgb(255, 255, 255)');
  expect(collectionTextColor).toBe('rgb(255, 255, 255)');
});

test('PDS font preload links are emitted into the Home document head', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('head link[rel="preload"][as="font"]').first()).toHaveCount(1);
});

test('Worker applies SPA fallback to the Home page for unknown paths', async ({ request }) => {
  const response = await request.get('/__ouranos_infrastructure_smoke_test__');
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toContain('<title>Ouranos | Home</title>');
});
