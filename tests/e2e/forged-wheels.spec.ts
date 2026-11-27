import { expect, test } from '@playwright/test';

test('forged wheels landing page is independent from the existing wheels catalogue', async ({ page }) => {
  await page.goto('/forged-wheels/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle(/OURANOS \| Forged Wheels/);
  await expect(page.locator('.ouranos-header')).toHaveAttribute('data-header-variant', 'stacked');
  await expect(page.locator('#ouranos-ai-open')).toBeVisible();
  await expect(page.locator('#forged-hero-title')).toContainText('FORGED.');
  await expect(page.locator('.forged-hero__video source')).toHaveAttribute('src', '/videos/mood-porsche-gts.mp4');
  await expect(page.locator('#collection-title')).toBeVisible();
  await expect(page.locator('#engineering-title')).toBeVisible();
  await expect(page.locator('#customization-title')).toBeVisible();
  await expect(page.locator('#ordering-title')).toBeVisible();
  await expect(page.locator('#fitment-title')).toBeVisible();
  await expect(page.locator('#faq-title')).toBeVisible();

  const video = page.locator('.forged-hero__video');
  await page.locator('#forged-video-toggle').click();
  await expect(video).toHaveJSProperty('paused', true);
  await expect(page.locator('#forged-video-label')).toHaveText('Play film');

  await page.goto('/wheels/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#wheels-grid')).toBeVisible();
  await expect(page.locator('#catalogue-title')).toBeVisible();
});

test('forged wheels page remains responsive and navigation exposes the new destination', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/forged-wheels/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#ouranos-ai-open')).toBeVisible();
  await expect(page.locator('#nav-button')).toBeVisible();
  await page.locator('#nav-button').click();
  await expect(page.locator('#nav-drilldown')).toHaveJSProperty('open', true);
  await expect(page.locator('#nav-drilldown a[href="/forged-wheels/"]')).toBeVisible();

  const pageWidth = await page.locator('body').evaluate((element) => element.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(pageWidth).toBeLessThanOrEqual(viewportWidth);
});
