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


test('Discover Wheels submits a public product URL and displays catalogue matches', async ({ page }) => {
  await page.route('**/api/discover/url', async (route) => {
    await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ jobId: '123e4567-e89b-12d3-a456-426614174000', status: 'queued' }) });
  });
  await page.route('**/api/discover/jobs/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        job: { id: '123e4567-e89b-12d3-a456-426614174000', status: 'completed' },
        matches: [{ id: 'match-1', match_type: 'specification_similar', product_name: 'OURANOS Test Wheel', similarity_score: null }],
      }),
    });
  });
  await page.goto('/discover/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-method="url"]').click();
  await page.locator('#product-url').fill('https://example.com/product/wheel');
  await page.locator('#url-submit').click();
  await expect(page.locator('#url-status')).toContainText('已提取商品信息，并完成商品库检索。');
  await expect(page.locator('#url-panel')).toContainText('OURANOS Test Wheel');
  await expect(page.locator('#url-panel')).toContainText('specification similar');
});
