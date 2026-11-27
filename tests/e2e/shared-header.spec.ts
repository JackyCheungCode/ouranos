import { expect, test } from '@playwright/test';

test('shared header switches between overlay and stacked patterns and preserves AI access', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const header = page.locator('.ouranos-header');
  await expect(header).toHaveAttribute('data-header-variant', 'overlay');
  await expect(header).toHaveAttribute('data-locale', 'en');
  await expect(header).toHaveAttribute('data-shared-header-ready', 'true');
  await expect(header).toHaveAttribute('data-language-controller-ready', 'true');
  await expect(header).toHaveAttribute('data-theme-controller-ready', 'true');
  await expect(page.locator('#ouranos-theme-toggle')).toHaveCount(0);
  await expect(page.locator('#ouranos-search')).toHaveCount(0);
  await expect(page.locator('#ouranos-search-mobile')).toHaveCount(0);
  await expect(page.locator('html')).toHaveClass(/scheme-light/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#ouranos-ai-open')).toBeVisible();
  await expect(page.locator('.ouranos-header .scheme-dark')).toHaveCount(0);
  await expect(page.locator('.ouranos-header [aria-label="Ouranos Home"]')).toHaveCSS(
    'color',
    'rgb(1, 2, 5)',
  );
  await expect(page.locator('.ouranos-header [style*="color: #010205"]')).toHaveCount(4);

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

  await page.goto('/wheels/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.ouranos-header')).toHaveAttribute('data-header-variant', 'stacked');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.locator('#ouranos-ai-open')).toBeVisible();
  await expect(page.locator('#ouranos-category-tabs')).toBeVisible();
  await expect(page.locator('.ouranos-header .scheme-dark')).toHaveCount(0);
  await expect(page.locator('.ouranos-header [aria-label="Ouranos Home"]')).toHaveCSS(
    'color',
    'rgb(1, 2, 5)',
  );
  await expect(page.locator('.ouranos-header > div:first-child')).not.toHaveCSS(
    'color',
    'rgb(255, 255, 255)',
  );

  await page.locator('#ouranos-ai-open').click();
  await expect(page.locator('#ouranos-ai-panel')).toHaveClass(/is-open/);

  await page.locator('#nav-button').click();
  await expect(page.locator('#ouranos-ai-panel')).not.toHaveClass(/is-open/);
  await expect(page.locator('#nav-drilldown')).toHaveJSProperty('open', true);
});

test('shared header keeps language, AI and menu controls available on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/contact/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.ouranos-header')).toHaveAttribute('data-header-variant', 'stacked');
  await expect(page.locator('#ouranos-language-trigger')).toBeVisible();
  await expect(page.locator('#ouranos-ai-open')).toBeVisible();
  await expect(page.locator('#nav-button')).toBeVisible();
  await expect(page.locator('#ouranos-search-mobile')).toHaveCount(0);
  await expect(page.locator('#ouranos-search')).toHaveCount(0);
  await expect(page.locator('#ouranos-theme-toggle')).toHaveCount(0);
  await expect(page.locator('.ouranos-header__primary-nav')).toBeHidden();
});
