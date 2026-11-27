import { expect, test } from '@playwright/test';

test('Discover Wheels is served as a standalone PDS page', async ({ page }) => {
  await page.goto('/discover/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle('OURANOS | Discover Wheels');
  await expect(page.locator('#discover-title')).toContainText('Discover Wheels');
  await expect(page.locator('#nav-drilldown')).toHaveCount(1);
  await expect(page.locator('[data-method="image"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#image-panel')).toBeVisible();
  await expect(page.locator('#url-panel')).toBeHidden();
});

test('Discover Wheels image intake validates files and previews accepted images', async ({ page }) => {
  await page.goto('/discover/', { waitUntil: 'domcontentloaded' });
  await page.locator('#wheel-image').setInputFiles({
    name: 'reference.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pZ8AAAAASUVORK5CYII=', 'base64'),
  });
  await expect(page.locator('#image-status')).toContainText('Reference image ready');
  await expect(page.locator('#image-submit')).not.toHaveAttribute('disabled', '');
  await expect(page.locator('#image-preview')).toBeVisible();
  await page.locator('#remove-image').click();
  await expect(page.locator('#image-submit')).toHaveAttribute('disabled', '');
  await expect(page.locator('#image-dropzone')).toBeVisible();
});

test('Discover Wheels switches to URL intake and rejects unsafe URLs', async ({ page }) => {
  await page.goto('/discover/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-method="url"]').click();
  await expect(page.locator('#url-panel')).toBeVisible();
  await expect(page.locator('#image-panel')).toBeHidden();
  await page.locator('#product-url').fill('http://127.0.0.1/admin');
  await page.locator('#url-submit').click();
  await expect(page.locator('#url-status')).toContainText('public product page URL');
  await expect(page.locator('#url-status')).toHaveAttribute('data-state', 'error');
});
