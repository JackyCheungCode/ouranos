import { expect, test } from '@playwright/test';

test('Home page is served at the root with shared Ouranos layout', async ({ page, request }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveTitle('Ouranos | Home');
  await expect(page.locator('p-heading#heading-section-1')).toContainText('Home');
  await expect(page.locator('p-button[href="/wheels"]')).toHaveText('Explore Wheels');
  await expect(page.getByText('Some label')).toHaveCount(0);
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

  for (const line of [
    'PERFORMANCE / 性能运动系列',
    'LUXURY / 豪华定制系列',
    'STREET / 街道改装系列',
    'OFF-ROAD / 越野 SUV 系列',
    'HERITAGE / 经典复古系列',
  ]) {
    await expect(page.locator(`p-link-tile[label="${line}"]`)).toHaveCount(1);
  }

  await expect(page.locator('p-carousel p-link-tile')).toHaveCount(5);
});

test('Home overlay navigation and image tiles use the dark PDS scheme', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('header');
  await expect(header).toHaveCSS('color-scheme', 'dark');
  await expect(header.locator('a[aria-label="Ouranos Home"]').first()).toHaveCSS(
    'color',
    'rgb(255, 255, 255)',
  );
  await expect(header.locator('p-button-pure')).toHaveAttribute('color', 'primary');

  for (const tile of [
    page.locator('p-link-tile[label="Find Wheels for Your Vehicle"]'),
    page.locator('p-link-tile[label="Customize Your Wheels"]'),
    page.locator('p-link-tile[label="PERFORMANCE / 性能运动系列"]'),
  ]) {
    await expect(tile).toHaveAttribute('gradient', 'true');
    const scheme = await tile.evaluate((element) => getComputedStyle(element).colorScheme);
    expect(scheme).toContain('dark');
  }
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
