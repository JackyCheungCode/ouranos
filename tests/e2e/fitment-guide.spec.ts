import { expect, test, type Page } from '@playwright/test';

async function mockVehicleCatalogue(page: Page) {
  await page.route('**/api/wheel-size/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const responses: Record<string, unknown> = {
      '/api/wheel-size/regions': {
        data: [
          { name: 'USA+', slug: 'usdm' },
          { name: 'Europe', slug: 'eudm' },
          { name: 'Japan', slug: 'jdm' },
        ],
      },
      '/api/wheel-size/makes': { data: [{ name: 'Porsche', slug: 'porsche', logo: 'https://cdn.example.test/porsche.png' }] },
      '/api/wheel-size/models': { data: [{ name: '911', slug: '911' }] },
      '/api/wheel-size/years': { data: [{ name: '2025', slug: '2025' }] },
      '/api/wheel-size/modifications': { data: [{ name: 'Carrera GTS', slug: 'carrera-gts' }] },
      '/api/wheel-size/search/by_model': {
        data: [
          {
            type: 'oe',
            technical: { bolt_pattern: '5x130', centre_bore: 71.6 },
            wheels: [
              {
                front: { rim: { diameter: 20, width: 8.5, offset: 50 } },
                rear: { rim: { diameter: 21, width: 11.5, offset: 45 } },
              },
            ],
          },
        ],
      },
    };
    const data = responses[path] || { data: [] };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
  await page.route('**/vehicles/DecodeVinValuesExtended/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ Results: [{ Make: 'Porsche', Model: '911', ModelYear: '2025', Trim: 'Carrera GTS' }] }),
    });
  });
}

async function choose(page: Page, selector: string, value: string) {
  await page.locator(selector).evaluate((element, nextValue) => {
    const select = element as HTMLSelectElement;
    select.value = nextValue;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

test('Fitment Guide retrieves factory wheel data from the vehicle catalogue', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mockVehicleCatalogue(page);
  await page.goto('/fitment-guide/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle('OURANOS | Wheel Fitment Guide');
  await expect(page.getByRole('heading', { name: 'The Right Fit Is Engineered.' })).toBeVisible();
  await expect(page.locator('.ouranos-header')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
  await expect(page.locator('#market')).toBeEnabled();
  await expect(page.locator('#market')).toHaveJSProperty('value', 'usdm');
  await choose(page, '#make', 'porsche');
  await expect(page.locator('#model')).toBeEnabled();
  await choose(page, '#model', '911');
  await expect(page.locator('#year')).toBeEnabled();
  await choose(page, '#year', '2025');
  await expect(page.locator('#variant')).toBeEnabled();
  await choose(page, '#variant', 'carrera-gts');

  await expect(page.locator('#fitment-table-wrap')).toBeVisible();
  await expect(page.locator('#vehicle-title')).toContainText('2025 Porsche 911 Carrera GTS');
  await expect(page.locator('#fitment-rows')).toContainText('ORIGINAL');
  await expect(page.locator('#fitment-rows')).toContainText('8.5J ×20 ET50');
  await expect(page.locator('#fitment-rows')).toContainText('11.5J ×21 ET45');
  await expect(page.locator('#fitment-rows')).toContainText('5x130');
  await expect(page.locator('#fitment-rows')).toContainText('71.6');
  await expect(page.locator('#api-status')).toHaveText('FACTORY DATA RETRIEVED');
  await expect(page.locator('.fitment-verification-note')).toContainText(
    'not an OURANOS fitment approval',
  );
  expect(errors).toEqual([]);
});

test('Fitment Guide keeps the vehicle result unavailable when the upstream API fails', async ({
  page,
}) => {
  await page.route('**/api/wheel-size/**', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'WHEEL_SIZE_NOT_CONFIGURED',
        message: 'Vehicle lookup is temporarily unavailable.',
      }),
    });
  });
  await page.goto('/fitment-guide/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#api-status')).toHaveText('VEHICLE MARKETS UNAVAILABLE');
  await expect(page.locator('#fitment-empty')).toContainText(
    'Vehicle lookup is temporarily unavailable',
  );
  await expect(page.locator('#fitment-table-wrap')).toBeHidden();
});


test('Fitment Guide decodes VIN and resolves the matching vehicle through the catalogue', async ({ page }) => {
  await mockVehicleCatalogue(page);
  await page.goto('/fitment-guide/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#market')).toBeEnabled();
  await expect(page.locator('#make p-select-option img')).toHaveAttribute('src', 'https://cdn.example.test/porsche.png');
  await page.locator('#vin').fill('WP0AB2A99SS123456');
  await page.locator('#vin-decode').click();
  await expect(page.locator('#vehicle-title')).toContainText('2025 Porsche 911 Carrera GTS');
  await expect(page.locator('#fitment-table-wrap')).toBeVisible();
  await expect(page.locator('#vin-status')).toContainText('VIN decoded');
});
