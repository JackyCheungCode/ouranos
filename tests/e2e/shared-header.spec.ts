import { expect, test } from '@playwright/test';

test('shared header switches between overlay and stacked patterns and preserves AI access', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const header = page.locator('.ouranos-header');
  await expect(header).toHaveAttribute('data-header-variant', 'overlay');
  await expect(page.locator('#ouranos-ai-open')).toBeVisible();

  await page.locator('#ouranos-language-trigger').click();
  const chineseOption = page.locator('[data-locale="zh-CN"]');
  await expect(chineseOption).toBeVisible();
  await chineseOption.click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(header).toHaveAttribute('data-locale', 'zh-CN');
  await expect(chineseOption).toHaveAttribute('aria-current', 'true');
  await expect(page).toHaveURL('/');

  await page.locator('#ouranos-language-trigger').click();
  await expect(chineseOption).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(chineseOption).toBeHidden();

  await page.goto('/wheels/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.ouranos-header')).toHaveAttribute(
    'data-header-variant',
    'stacked',
  );
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.locator('#ouranos-ai-open')).toBeVisible();

  await page.locator('#ouranos-ai-open').click();
  await expect(page.locator('#ouranos-ai-panel')).toHaveClass(/is-open/);

  await page.locator('#nav-button').click();
  await expect(page.locator('#nav-drilldown')).toHaveJSProperty('open', true);
});

test('shared header keeps language, AI and menu controls available on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/contact/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.ouranos-header')).toHaveAttribute(
    'data-header-variant',
    'stacked',
  );
  await expect(page.locator('#ouranos-language-trigger')).toBeVisible();
  await expect(page.locator('#ouranos-ai-open')).toBeVisible();
  await expect(page.locator('#nav-button')).toBeVisible();
  await expect(page.locator('.ouranos-header__primary-nav')).toBeHidden();
});
