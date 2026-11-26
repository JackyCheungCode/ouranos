import { expect, test } from '@playwright/test';

test('Cloudflare Worker serves the application root and compiled PDS styles', async ({ page, request }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveTitle('ouranos');
  await expect(page.locator('#root')).toBeAttached();

  const stylesheet = page.locator('link[rel="stylesheet"]').first();
  await expect(stylesheet).toHaveAttribute('href', /\.css(?:\?|$)/);
  const stylesheetUrl = await stylesheet.getAttribute('href');
  expect(stylesheetUrl).not.toBeNull();

  const cssResponse = await request.get(new URL(stylesheetUrl!, page.url()).toString());
  expect(cssResponse.ok()).toBeTruthy();
  expect(await cssResponse.text()).toContain('--pds-');
  expect(pageErrors).toEqual([]);
});

test('PDS font preload links are emitted into the document head', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('head link[rel="preload"][as="font"]').first()).toHaveCount(1);
});

test('Worker applies SPA fallback for unknown client-side paths', async ({ request }) => {
  const response = await request.get('/__ouranos_infrastructure_smoke_test__');
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toContain('<div id="root"></div>');
});
