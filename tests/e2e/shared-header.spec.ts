import { expect, test } from '@playwright/test';

const publicPages = [
  '/',
  '/wheels/',
  '/forged-wheels/',
  '/customize/',
  '/discover/',
  '/contact/',
  '/configure/',
];

test('every public page uses the exact Home overlay header and OURANOS script logo', async ({
  page,
}) => {
  for (const path of publicPages) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });

    const header = page.locator('.ouranos-header');
    await expect(header, `${path} must render the shared header`).toHaveAttribute(
      'data-header-variant',
      'overlay',
    );
    await expect(header).toHaveAttribute('data-locale', 'en');
    await expect(header).toHaveAttribute('data-shared-header-ready', 'true');
    await expect(header).toHaveAttribute('data-language-controller-ready', 'true');
    await expect(header).toHaveAttribute('data-theme-controller-ready', 'true');

    const brand = header.locator('a[aria-label="Ouranos Home"]');
    await expect(brand).toBeVisible();
    await expect(brand.locator('svg')).toHaveAttribute('viewBox', '0 0 560 210');
    await expect(brand.locator('svg title')).toHaveText('Ouranos');
    await expect(brand.locator('svg text')).toHaveText('Ouranos');
    await expect(brand.locator('svg text')).toHaveCSS('fill', 'rgb(255, 255, 255)');

    await expect(header.locator('#nav-button')).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(header.locator('#ouranos-language-trigger')).toHaveCSS(
      'color',
      'rgb(255, 255, 255)',
    );
    await expect(header.locator('#ouranos-ai-open')).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(header.locator('#ouranos-account')).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(page.locator('#ouranos-ai-open')).toBeVisible();
    await expect(page.locator('#ouranos-theme-toggle')).toHaveCount(0);
    await expect(page.locator('#ouranos-search')).toHaveCount(0);
    await expect(page.locator('.ouranos-header .scheme-dark')).toHaveCount(0);
  }
});

test('shared header preserves language selection, AI access and menu behaviour', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const header = page.locator('.ouranos-header');

  await page.locator('#ouranos-language-trigger').click();
  const chineseOption = page.locator('.ouranos-language-option[data-locale="zh-CN"]');
  await expect(chineseOption).toBeVisible();
  await chineseOption.click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(header).toHaveAttribute('data-locale', 'zh-CN');
  await expect(chineseOption).toHaveAttribute('aria-pressed', 'true');

  await page.locator('#ouranos-language-trigger').click();
  await expect(chineseOption).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(chineseOption).toBeHidden();

  await page.locator('#ouranos-ai-open').click();
  await expect(page.locator('#ouranos-ai-panel')).toHaveClass(/is-open/);

  await page.locator('#nav-button').click();
  await expect(page.locator('#ouranos-ai-panel')).not.toHaveClass(/is-open/);
  await expect(page.locator('#nav-drilldown')).toHaveJSProperty('open', true);
});

test('shared Home header remains usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/contact/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.ouranos-header')).toHaveAttribute('data-header-variant', 'overlay');
  await expect(page.locator('.ouranos-header__brand')).toBeVisible();
  await expect(page.locator('#ouranos-language-trigger')).toBeVisible();
  await expect(page.locator('#ouranos-ai-open')).toBeVisible();
  await expect(page.locator('#nav-button')).toBeVisible();
  await expect(page.locator('#ouranos-search-mobile')).toHaveCount(0);
  await expect(page.locator('#ouranos-search')).toHaveCount(0);
  await expect(page.locator('#ouranos-theme-toggle')).toHaveCount(0);
});
