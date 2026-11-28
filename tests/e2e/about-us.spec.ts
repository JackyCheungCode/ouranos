import { expect, test } from '@playwright/test';

test('About Us presents OURANOS engineering story with the shared PDS layout', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/about-us/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle('OURANOS | About Us — Beyond the Wheel');
  await expect(page.locator('main.about-shell')).toHaveCount(1);
  await expect(page.locator('main.about-shell > section')).toHaveCount(10);
  await expect(page.locator('p-heading#about-title')).toContainText('BEYOND');
  await expect(page.locator('p-heading#manufacturing-title')).toContainText('TWO MANUFACTURING ROUTES');
  await expect(page.locator('p-heading#quality-title')).toContainText('QUALITY MUST BE MEASURED');
  await expect(page.locator('p-heading#development-title')).toContainText('FROM CONCEPT');
  await expect(page.locator('p-button[href="/forged-wheels/collection/"]')).toHaveCount(2);
  await expect(page.locator('p-button[href="/cast-wheel-collection/"]')).toHaveCount(4);

  await expect(page.locator('.ouranos-header')).toHaveAttribute('data-header-variant', 'overlay');
  await expect(page.locator('#nav-drilldown')).toContainText('About Us');
  await expect(page.locator('footer')).toContainText('About Us');
  expect(await page.locator('p-heading').count()).toBeGreaterThan(10);
  expect(await page.locator('p-text').count()).toBeGreaterThan(20);
  expect(await page.locator('p-button').count()).toBeGreaterThan(5);

  expect(pageErrors).toEqual([]);
});
