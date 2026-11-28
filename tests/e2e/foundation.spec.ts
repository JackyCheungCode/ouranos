import { expect, test } from '@playwright/test';

test('Home page is served at the root with shared Ouranos layout', async ({ page, request }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle('Ouranos | Precision in Every Form');
  await expect(page.locator('p-heading#heading-section-1')).toContainText(
    'Precision in Every Form',
  );
  await expect(page.locator('header a[aria-label="Ouranos Home"] svg title').first()).toHaveText(
    'Ouranos',
  );
  await expect(page.locator('#nav-drilldown')).toHaveCount(1);
  await expect(page.locator('footer')).toContainText('Ouranos');

  const visibleText = await page.locator('body').innerText();
  expect(visibleText).not.toMatch(/Porsche/i);
  await expect(page.locator('p-wordmark, p-crest')).toHaveCount(0);

  const stylesheets = page.locator('link[rel="stylesheet"]');
  const stylesheetCount = await stylesheets.count();
  const stylesheetUrls: string[] = [];
  for (let index = 0; index < stylesheetCount; index += 1) {
    const href = await stylesheets.nth(index).getAttribute('href');
    if (href && /\\.css(?:\\?|$)/.test(href)) stylesheetUrls.push(href);
  }
  expect(stylesheetUrls.length).toBeGreaterThan(0);

  const stylesheetResponses = await Promise.all(
    stylesheetUrls.map((href) => request.get(new URL(href, page.url()).toString())),
  );
  expect(stylesheetResponses.every((response) => response.ok())).toBeTruthy();
  const stylesheetContents = await Promise.all(
    stylesheetResponses.map((response) => response.text()),
  );
  expect(stylesheetContents.some((css) => css.includes('--pds-'))).toBeTruthy();
  expect(pageErrors).toEqual([]);
});

test('Home exposes the two primary entry tiles and five wheel collections', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('p-link-tile[label="Find Wheels for Your Vehicle"]')).toHaveAttribute(
    'href',
    '/fitment',
  );
  await expect(page.locator('p-link-tile[label="Customize Your Wheels"]')).toHaveAttribute(
    'href',
    '/customize',
  );

  const collections = [
    ['Performance', 'Engineered for Driving Excellence'],
    ['Luxury', 'Refined by Design'],
    ['Street', 'Built for Individuality'],
    ['Off-road', 'Beyond the Ordinary'],
    ['Heritage', 'Timeless Automotive Design'],
  ];

  for (const [line, subtitle] of collections) {
    const tile = page.locator(`p-carousel p-link-tile[label="${line}"]`);
    await expect(tile).toHaveCount(1);
    await expect(tile).toHaveAttribute('description', subtitle);
    await expect(tile).not.toHaveAttribute('compact');
    await expect(page.getByText(subtitle, { exact: true })).toBeVisible();
  }

  await expect(page.locator('p-carousel p-link-tile')).toHaveCount(5);
});

test('Home header uses the white OURANOS script brand over the light page theme', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const header = page.locator('.ouranos-header');
  await expect(page.locator('html')).toHaveClass(/scheme-light/);
  await expect(header).toHaveAttribute('data-header-variant', 'overlay');
  await expect(header.locator('a[aria-label="Ouranos Home"] svg text')).toHaveCSS(
    'fill',
    'rgb(255, 255, 255)',
  );

  const headerButtons = header.locator(
    'p-button-pure#nav-button, p-button-pure#ouranos-ai-open, p-button-pure#ouranos-account',
  );
  await expect(headerButtons).toHaveCount(3);
  for (let index = 0; index < (await headerButtons.count()); index += 1) {
    await expect(headerButtons.nth(index)).toHaveCSS('color', 'rgb(255, 255, 255)');
  }
  await expect(header.locator('#ouranos-language-trigger')).toHaveCount(0);

  for (const tile of [
    page.locator('p-link-tile[label="Find Wheels for Your Vehicle"]'),
    page.locator('p-link-tile[label="Customize Your Wheels"]'),
    page.locator('p-link-tile[label="Performance"]'),
  ]) {
    await expect(tile).toHaveAttribute('gradient', 'true');
    const scheme = await tile.evaluate((element) => getComputedStyle(element).colorScheme);
    expect(scheme).toContain('light');
  }
});

test('PDS font preload links are emitted into the Home document head', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('head link[rel="preload"][as="font"]').first()).toHaveCount(1);
});

test('Worker applies SPA fallback to the Home page for unknown paths', async ({ request }) => {
  const response = await request.get('/__ouranos_infrastructure_smoke_test__');
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toContain('<title>Ouranos | Precision in Every Form</title>');
});