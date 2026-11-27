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

test('Discover Wheels image intake validates files and previews accepted images', async ({
  page,
}) => {
  await page.goto('/discover/', { waitUntil: 'domcontentloaded' });
  await page.locator('#wheel-image').setInputFiles({
    name: 'reference.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pZ8AAAAASUVORK5CYII=',
      'base64',
    ),
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

test('URL discovery shows extracted product details and waits for explicit confirmation', async ({
  page,
}) => {
  let confirmed = false;
  await page.route('**/api/discover/url', async (route) => {
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ jobId: '123e4567-e89b-12d3-a456-426614174000', status: 'queued' }),
    });
  });
  await page.route('**/api/discover/jobs/**', async (route) => {
    if (route.request().method() === 'POST') {
      confirmed = true;
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ jobId: '123e4567-e89b-12d3-a456-426614174000', status: 'queued' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        job: { id: '123e4567-e89b-12d3-a456-426614174000', status: 'completed' },
        reference: {
          extracted_title: 'Forged Performance Wheel',
          extracted_brand: 'Example Wheels',
          extracted_model: 'F-01',
          extracted_image_url: 'https://example.com/wheel.jpg',
          extracted_specs_json: JSON.stringify({
            sku: 'F01-19',
            diameter: 19,
            width: 8.5,
            pcdHoles: 5,
            pcdMm: 112,
            offsetMm: 35,
          }),
          source_domain: 'example.com',
          confirmation_status: confirmed ? 'confirmed' : 'pending',
        },
        matches: confirmed
          ? [
              {
                id: 'match-1',
                match_type: 'specification_similar',
                product_name: 'OURANOS Test Wheel',
                similarity_score: null,
              },
            ]
          : [],
      }),
    });
  });
  await page.goto('/discover/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-method="url"]').click();
  await page.locator('#product-url').fill('https://example.com/product/wheel');
  await page.locator('#url-submit').click();
  await expect(page.locator('#url-product-preview')).toBeVisible();
  await expect(page.locator('#url-product-title')).toContainText('Forged Performance Wheel');
  await expect(page.locator('#url-product-image')).toHaveAttribute(
    'src',
    'https://example.com/wheel.jpg',
  );
  await expect(page.locator('#url-product-fields')).toContainText('Example Wheels');
  await expect(page.locator('#url-product-fields')).toContainText('5 × 112');
  await expect(page.locator('#url-status')).toContainText('请核对图片和参数');
  await expect(page.locator('#discovery-results')).toHaveCount(0);
  await page.locator('#url-confirm-search').click();
  await expect.poll(() => confirmed).toBe(true);
  await expect(page.locator('#url-panel')).toContainText('OURANOS Test Wheel');
  await expect(page.locator('#url-panel')).toContainText('specification similar');
});
