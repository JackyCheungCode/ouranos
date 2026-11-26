import { expect, test, type Page } from '@playwright/test';

async function mockWheelSize(page: Page) {
  await page.route('**/api/wheel-size/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    let data: unknown[] = [];
    if (path.endsWith('/makes/')) data = [{ name: 'Porsche', slug: 'porsche' }];
    else if (path.endsWith('/models/')) data = [{ name: '911', slug: '911' }];
    else if (path.endsWith('/years/')) data = [{ name: '2024', slug: '2024' }];
    else if (path.endsWith('/modifications/')) data = [{ name: 'Carrera GTS', slug: 'carrera-gts' }];
    else if (path.endsWith('/search/by_model/')) {
      data = [{
        type: 'oe',
        technical: { bolt_pattern: '5x130', centre_bore: 71.6 },
        wheels: [{
          front: { rim: { diameter: 20, width: 8.5, offset: 50 } },
          rear: { rim: { diameter: 21, width: 11.5, offset: 45 } },
        }],
      }];
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) });
  });
}

async function choose(page: Page, selector: string, value: string) {
  await page.locator(selector).evaluate((element, nextValue) => {
    const select = element as HTMLSelectElement;
    select.value = nextValue;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

test('Configurator retrieves USDM fitment and maps staggered front/rear specifications', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mockWheelSize(page);
  await page.goto('/customize/');

  await expect(page).toHaveTitle('Ouranos | Bespoke Forged Wheel Studio');
  await expect(page.getByRole('heading', { name: /Find your vehicle/i })).toBeVisible();
  await expect(page.locator('#market')).toHaveJSProperty('value', 'usdm');
  await expect(page.locator('#make')).toBeVisible();

  await choose(page, '#make', 'porsche');
  await expect(page.locator('#model')).toBeEnabled();
  await choose(page, '#model', '911');
  await expect(page.locator('#year')).toBeEnabled();
  await choose(page, '#year', '2024');
  await expect(page.locator('#fitment-table-wrap')).toBeVisible();
  await expect(page.locator('#fitment-rows')).toContainText('ORIGINAL');
  await expect(page.locator('#fitment-rows')).toContainText('8.5J×20 ET50');
  await expect(page.locator('#fitment-rows')).toContainText('11.5J×21 ET45');

  await page.getByRole('button', { name: 'SELECT', exact: true }).click();
  await page.locator('#next-button').click();
  await expect(page.locator('[data-panel="1"]')).toBeVisible();
  await expect(page.locator('#front-diameter')).toHaveJSProperty('value', '20');
  await expect(page.locator('#front-width')).toHaveJSProperty('value', '8.5');
  await expect(page.locator('#front-offset')).toHaveJSProperty('value', '50');
  await expect(page.locator('#front-pcd')).toHaveJSProperty('value', '5x130');
  await expect(page.locator('#front-bore')).toHaveJSProperty('value', '71.6');
  await expect(page.locator('#rear-diameter')).toHaveJSProperty('value', '21');
  await expect(page.locator('#rear-width')).toHaveJSProperty('value', '11.5');
  await expect(page.locator('#rear-offset')).toHaveJSProperty('value', '45');

  await page.locator('#next-button').click();
  await choose(page, '#wheel-color', 'bronze');
  await page.locator('#next-button').click();
  await expect(page.locator('#review-summary')).toContainText('2024 Porsche 911 Carrera GTS');
  await expect(page.locator('#review-summary')).toContainText('5x130');

  expect(errors).toEqual([]);
});

test('Configurator hero is full bleed and model zoom controls remain available on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockWheelSize(page);
  await page.goto('/customize/');
  const hero = await page.locator('.customizer-hero').boundingBox();
  expect(hero).not.toBeNull();
  expect(hero?.x).toBe(0);
  expect(hero?.y).toBe(0);
  expect(hero?.width).toBe(390);
  await expect(page.locator('#zoom-in')).toBeVisible();
  await expect(page.locator('#zoom-out')).toBeVisible();
  await expect(page.locator('#zoom-reset')).toBeVisible();
  const documentWidth = await page.locator('body').evaluate((body) => body.scrollWidth);
  expect(documentWidth).toBeLessThanOrEqual(390);
});

test('Configurator prepares a downloadable engineering specification', async ({ page }) => {
  await mockWheelSize(page);
  await page.goto('/customize/');
  await page.locator('#customer-name').evaluate((element) => {
    (element as HTMLInputElement).value = 'Test Customer';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#customer-email').evaluate((element) => {
    (element as HTMLInputElement).value = 'customer@example.com';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#submit-button').evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
  await expect(page.locator('#submission-message')).toBeVisible();
  await expect(page.locator('#submission-message')).toContainText('has not been transmitted');
  await expect(page.locator('#submission-message')).toContainText('DOWNLOAD CONFIGURATION');
});
