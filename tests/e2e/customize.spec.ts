import { expect, test, type Page } from '@playwright/test';

async function mockWheelSize(page: Page) {
  await page.route('**/api/models**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        models: [
          {
            key: 'models/test-wheel.glb',
            name: 'Test Wheel',
            size: 1024,
            url: '/api/models/file?key=models%2Ftest-wheel.glb',
          },
        ],
      }),
    });
  });
  await page.route('**/api/wheel-size/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    let data: unknown[] = [];
    if (path.endsWith('/regions'))
      data = [
        { name: 'USA+', slug: 'usdm' },
        { name: 'Canada', slug: 'cdm' },
      ];
    else if (path.endsWith('/makes')) data = [{ name: 'Porsche', slug: 'porsche' }];
    else if (path.endsWith('/models')) data = [{ name: '911', slug: '911' }];
    else if (path.endsWith('/years')) data = [{ name: '2024', slug: '2024' }];
    else if (path.endsWith('/modifications')) data = [{ name: 'Carrera GTS', slug: 'carrera-gts' }];
    else if (path.endsWith('/search/by_model')) {
      data = [
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
      ];
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data }),
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

async function chooseMarket(page: Page) {
  await expect(page.locator('#market')).toBeEnabled();
  await choose(page, '#market', 'usdm');
}

test('Configurator retrieves USDM fitment and maps staggered front/rear specifications', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack || error.message));
  await mockWheelSize(page);
  await page.goto('/customize/');

  await expect(page).toHaveTitle('Ouranos | Wheel Configurator');
  await expect(page.getByRole('heading', { name: /Choose your wheel model/i })).toBeVisible();
  await expect(page.locator('#model-list .model-card')).toHaveCount(1);
  await expect(page.locator('#model-page-label')).toHaveText('PAGE 1 / 1');
  await page.locator('#model-list .model-card').click();
  await expect(page.locator('#model-list .model-card')).toHaveAttribute('aria-selected', 'true');
  await page.locator('#next-button').click();
  await expect(page.getByRole('heading', { name: /Find your vehicle/i })).toBeVisible();
  await expect(page.locator('#market')).toBeEnabled();
  await expect(page.locator('#market')).toHaveJSProperty('value', 'usdm');
  await chooseMarket(page);
  await expect(page.locator('#market')).toContainText('United States (USDM)');
  await expect(page.locator('#market')).toContainText('Canada');
  await expect(page.locator('#market')).not.toContainText('Europe');
  await expect(page.locator('#make')).toBeVisible();
  await expect(page.locator('#make p-select-option').filter({ hasText: 'Porsche' })).toHaveCount(1);
  await expect(page.locator('#make')).toBeEnabled();

  await choose(page, '#make', 'porsche');
  await expect(page.locator('#model')).toBeEnabled();
  await choose(page, '#model', '911');
  await expect(page.locator('#year')).toBeEnabled();
  await choose(page, '#year', '2024');
  await expect(page.locator('#fitment-table-wrap')).toBeVisible();
  await expect(page.locator('#fitment-rows')).toContainText('ORIGINAL');
  await expect(page.locator('#fitment-rows')).toContainText('8.5J ×20 ET50');
  await expect(page.locator('#fitment-rows')).toContainText('11.5J ×21 ET45');
  await choose(page, '#variant', 'carrera-gts');
  await expect(page.locator('#api-status')).toHaveText('FITMENT DATA LOADED');
  await expect(page.locator('#fitment-table-wrap')).toBeVisible();
  await page.locator('.fitment-select-button').first().click();
  await expect(page.locator('#fitment-selection')).toBeVisible();

  await page.locator('#next-button').click();
  await expect(page.locator('[data-panel="2"]')).toBeVisible();
  await expect(page.locator('[data-panel="2"]')).not.toContainText(
    /Wheel Size|API key|API source/i,
  );
  await expect(page.locator('.axle-spec').first()).toHaveCSS('color-scheme', 'light');
  await expect(page.locator('.axle-spec').nth(0)).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
  await expect(page.locator('.axle-spec').nth(1)).toHaveCSS('color-scheme', 'light');
  await expect(page.locator('.axle-spec').nth(1)).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
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

test('Selecting a manufacturer with the native PDS select loads its models', async ({ page }) => {
  await mockWheelSize(page);
  await page.goto('/customize/');
  await page.locator('#model-list .model-card').click();
  await page.locator('#next-button').click();
  await chooseMarket(page);
  await expect(page.locator('#make')).toBeEnabled();
  await choose(page, '#make', 'porsche');
  await expect(page.locator('#model')).toBeEnabled();
  await expect(page.locator('#model')).toContainText('911');
});

test('Configurator hero is full bleed and model zoom controls remain available on mobile', async ({
  page,
}) => {
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

test('Vehicle step can be skipped and manual wheel dimensions remain available', async ({
  page,
}) => {
  await page.route('**/api/models**', async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        models: [
          {
            key: 'models/test-wheel.glb',
            name: 'Test Wheel',
            size: 1024,
            url: '/api/models/file?key=models%2Ftest-wheel.glb',
          },
        ],
      }),
    }),
  );
  await page.route('**/api/wheel-size/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/regions')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ name: 'USA+', slug: 'usdm' }] }),
      });
      return;
    }
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'WHEEL_SIZE_NOT_CONFIGURED',
        message: 'Wheel Size API credentials are not configured on this Worker.',
      }),
    });
  });
  await page.goto('/customize/');
  await page.locator('#model-list .model-card').click();
  await page.locator('#next-button').click();
  await chooseMarket(page);
  await expect(page.locator('#api-status')).toHaveText('VEHICLE LOOKUP UNAVAILABLE');
  await expect(page.locator('body')).not.toContainText(/Wheel Size|API key|API source/i);
  await page.locator('#skip-vehicle').click();
  await expect(page.locator('[data-panel="2"]')).toBeVisible();
  await expect(page.locator('#front-diameter')).toBeVisible();
  await expect(page.locator('#rear-diameter')).toBeVisible();
  await expect(page.locator('#front-source')).toContainText('MANUAL ENTRY');
  await page.locator('#front-diameter').evaluate((element) => {
    (element as HTMLInputElement).value = '20';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#summary-front')).toContainText('20');
});

test('Manufacturer uses the native PDS select without oversized option logos', async ({ page }) => {
  await mockWheelSize(page);
  await page.goto('/customize/');
  await page.locator('#model-list .model-card').click();
  await page.locator('#next-button').click();
  const make = page.locator('#make');
  await expect(make).toBeVisible();
  await expect(make).toHaveJSProperty('tagName', 'P-SELECT');
  await expect(make.locator('p-select-option').filter({ hasText: 'Porsche' })).toHaveCount(1);
  await expect(make.locator('p-select-option > img')).toHaveCount(1);
  await expect(make).toBeEnabled();
  await choose(page, '#make', 'porsche');
  await expect(page.locator('#model')).toBeEnabled();
  await expect(page.locator('#model')).toContainText('911');
  const stepper = page.locator('.configuration-panel #config-stepper');
  await expect(stepper).toBeVisible();
  await expect(stepper).toHaveAttribute('size', 'medium');
  await expect(stepper.locator('p-stepper-horizontal-item')).toHaveCount(5);
  for (const iconName of ['tire', 'car', 'configurate', 'color-picker', 'document']) {
    await expect(
      stepper.locator('p-stepper-horizontal-item p-icon[name="' + iconName + '"]'),
    ).toHaveCount(1);
  }
  await expect(page.locator('.config-heading p-heading')).toHaveAttribute('size', 'xl');
  await expect(page.locator('.config-step.active > p-heading')).toHaveAttribute('size', 'md');
  const stepLabels = await stepper
    .locator('p-stepper-horizontal-item')
    .evaluateAll((items) =>
      items.map((item) => (item.textContent || '').replace(/current:/gi, '').trim()),
    );
  expect(stepLabels).toEqual(['Model', 'Vehicle', 'Dimensions', 'Finish', 'Review']);
  const zoomDirection = await page
    .locator('.zoom-controls')
    .evaluate((el) => getComputedStyle(el).flexDirection);
  expect(zoomDirection).toBe('column');
});


test('Configurator defaults to the first wheel model and supports Back and the primary menu', async ({
  page,
}) => {
  await mockWheelSize(page);
  await page.goto('/customize/');
  const firstModel = page.locator('#model-list .model-card').first();
  await expect(firstModel).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#back-button')).toHaveAttribute('disabled', '');
  await page.locator('#next-button').click();
  await expect(page.locator('[data-panel="1"]')).toBeVisible();
  await expect(page.locator('#back-button')).not.toHaveAttribute('disabled');
  await page.locator('#back-button').click();
  await expect(page.locator('[data-panel="0"]')).toBeVisible();
  await page.locator('#next-button').click();
  await page.locator('#nav-button').click();
  await expect(page.locator('#nav-drilldown')).toHaveJSProperty('open', true);
  await expect(page.locator('#nav-drilldown')).toContainText('Wheel Configurator');
});

test('Missing rear axle API data is initialized from the front axle', async ({ page }) => {
  await mockWheelSize(page);
  await page.route('**/api/wheel-size/search/by_model**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            type: 'oe',
            technical: { bolt_pattern: '5x130', centre_bore: 71.6 },
            wheels: [{ front: { rim: { diameter: 20, width: 8.5, offset: 50 } } }],
          },
        ],
      }),
    });
  });
  await page.goto('/customize/');
  await page.locator('#next-button').click();
  await chooseMarket(page);
  await choose(page, '#make', 'porsche');
  await choose(page, '#model', '911');
  await choose(page, '#year', '2024');
  await expect(page.locator('#fitment-table-wrap')).toBeVisible();
  await page.locator('.fitment-select-button').first().click();
  await page.locator('#next-button').click();
  for (const field of ['diameter', 'width', 'offset', 'pcd', 'bore']) {
    await expect(page.locator('#rear-' + field)).toHaveJSProperty(
      'value',
      await page.locator('#front-' + field).evaluate((element) => (element as HTMLElement & { value: string }).value),
    );
  }
});

test('Configurator prepares a downloadable engineering specification', async ({ page }) => {
  await mockWheelSize(page);
  await page.goto('/customize/');
  await page.locator('#model-list .model-card').click();
  await page.locator('#next-button').click();
  await chooseMarket(page);
  await choose(page, '#make', 'porsche');
  await choose(page, '#model', '911');
  await choose(page, '#year', '2024');
  await expect(page.locator('#fitment-table-wrap')).toBeVisible();
  await page.getByRole('button', { name: 'SELECT', exact: true }).click();
  await expect(page.locator('#fitment-selection')).toBeVisible();
  await page.locator('#next-button').click();
  await page.locator('#next-button').click();
  await page.locator('#next-button').click();
  await page.locator('#customer-name').evaluate((element) => {
    (element as HTMLInputElement).value = 'Test Customer';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#customer-email').evaluate((element) => {
    (element as HTMLInputElement).value = 'customer@example.com';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#submit-button').click();
  await expect(page.locator('#submission-message')).toBeVisible();
  await expect(page.locator('#submission-message')).toContainText('has not been transmitted');
  await expect(page.locator('#submission-message')).toContainText('DOWNLOAD CONFIGURATION');
});
