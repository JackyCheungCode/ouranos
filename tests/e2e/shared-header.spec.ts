import { expect, test } from '@playwright/test';

const publicPages = [
  '/',
  '/cast-wheel-collection/',
  '/forged-wheels/collection/',
  '/customize/',
  '/discover/',
  '/contact/',
  '/configure/',
  '/about-us/',
];

test('every public page uses the shared Home overlay header and OURANOS script logo', async ({
  page,
}) => {
  for (const path of publicPages) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });

    const header = page.locator('.ouranos-header');
    await expect(header, `${path} must render the shared header`).toHaveAttribute(
      'data-header-variant',
      'overlay',
    );
    await expect(header).toHaveAttribute('data-shared-header-ready', 'true');
    await expect(header).toHaveAttribute('data-theme-controller-ready', 'true');

    const brand = header.locator('a[aria-label="Ouranos Home"]');
    await expect(brand).toBeVisible();
    await expect(brand.locator('svg')).toHaveAttribute('viewBox', '0 0 560 210');
    await expect(brand.locator('svg title')).toHaveText('Ouranos');
    await expect(brand.locator('svg text')).toHaveText('Ouranos');
    await expect(brand.locator('svg text')).toHaveCSS('fill', 'rgb(255, 255, 255)');

    await expect(header.locator('#nav-button')).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(header.locator('#ouranos-ai-open')).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(header.locator('#ouranos-account')).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(header.locator('#ouranos-language-trigger')).toHaveCount(0);
    await expect(header.locator('#ouranos-language-popover')).toHaveCount(0);
    await expect(page.locator('#ouranos-ai-open')).toBeVisible();
    await expect(page.locator('#ouranos-theme-toggle')).toHaveCount(0);
    await expect(page.locator('#ouranos-search')).toHaveCount(0);
    await expect(page.locator('.ouranos-header .scheme-dark')).toHaveCount(0);
  }
});

test('sidebar exposes About Ouranos and Support links as first-level destinations', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const drilldown = page.locator('#nav-drilldown');

  await expect(drilldown.locator(':scope > p-drilldown-link a[href="/about-us/"]')).toHaveText(
    'About Ouranos',
  );
  await expect(drilldown.locator(':scope > p-drilldown-link a[href="/customize/"]')).toContainText(
    'Wheel Design Studio',
  );
  await expect(drilldown.locator(':scope > p-drilldown-link a[href="/contact/"]')).toHaveText(
    'Contact us',
  );
  await expect(drilldown.locator('p-drilldown-item[label="Support"]')).toHaveCount(0);
  await expect(drilldown.locator('p-drilldown-item[label="OURANOS"]')).toHaveCount(0);
});

test('shared header controls remain clickable on every public page', async ({ page }) => {
  for (const path of publicPages) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });

    const navButton = page.locator('#nav-button');
    await expect(navButton).toBeVisible();
    await navButton.click();
    await expect(page.locator('#nav-drilldown')).toHaveJSProperty('open', true);

    await page.reload({ waitUntil: 'domcontentloaded' });
    const aiButton = page.locator('#ouranos-ai-open');
    await expect(aiButton).toBeVisible();
    await aiButton.click();
    await expect(page.locator('#ouranos-ai-panel')).toHaveClass(/is-open/);
  }
});

test('shared Home header remains usable on mobile with a single-row action group', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/contact/', { waitUntil: 'domcontentloaded' });

  const header = page.locator('.ouranos-header');
  await expect(header).toHaveAttribute('data-header-variant', 'overlay');
  await expect(header.locator('.ouranos-header__brand')).toBeVisible();
  await expect(header.locator('#ouranos-language-trigger')).toHaveCount(0);
  await expect(header.locator('#ouranos-ai-open')).toBeVisible();
  await expect(header.locator('#nav-button')).toBeVisible();
  await expect(header.locator('#ouranos-account')).toBeVisible();
  await expect(header.locator('#ouranos-search-mobile')).toHaveCount(0);
  await expect(header.locator('#ouranos-search')).toHaveCount(0);
  await expect(header.locator('#ouranos-theme-toggle')).toHaveCount(0);
});