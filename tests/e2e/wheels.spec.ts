import { expect, test } from '@playwright/test';

test('Wheels catalogue uses the PDS Vehicle Listing pattern with multi-parameter specifications', async ({
  page,
}) => {
  await page.goto('/wheels/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle('OURANOS | Wheels');
  await expect(page.locator('#wheels-hero-title')).toContainText('ENGINEERED TO DEFINE');
  await expect(page.locator('[data-product]')).toHaveCount(10);
  await expect(page.locator('#product-count')).toContainText('10 products');
  await expect(page.locator('[data-product]').first()).toContainText('FORGED');
  await expect(page.locator('[data-product]').first().locator('.wheel-card__customization')).toContainText('Wheel dimensions');
  await expect(page.locator('[data-product]').first().locator('.wheel-card__customization')).toContainText('ET · PCD · CB');
  await expect(page.locator('[data-product]').first().locator('.wheel-card__customization')).toContainText('Center Cap · Engraving');
  await expect(page.locator('[data-product]').first().locator('.wheel-card__customization-group p-icon')).toHaveCount(4);
  await expect(page.locator('[data-product]').first().locator('.wheel-card__customization-group p-icon').evaluateAll((icons) => icons.map((icon) => icon.getAttribute('name')))).resolves.toEqual(['adjust', 'car', 'color-picker', 'edit']);
  await expect(page.locator('[data-product]').first()).toContainText('Manufacturing lead time');
  await expect(page.locator('[data-product]').first()).toContainText('10–15 days');
  await expect(page.locator('[data-product]').first()).not.toContainText('Enquire about this wheel');
  await expect(page.locator('[data-product]').first()).toContainText('Discover');
  await expect(page.locator('[data-product]').first()).toContainText('Configure');
  await expect(page.locator('[data-product]').first().locator('a.wheel-card__action--primary')).toHaveAttribute('href', /\/wheels\/\?model=/);
  await expect(page.locator('[data-product]').first().locator('a.wheel-card__action--secondary')).toHaveAttribute('href', /\/configure\//);
  await expect(page.locator('.wheels-demo-note')).toContainText('TEMPORARY APEX TEST DATA');
  await expect(page.locator('body')).not.toContainText('Add to cart');
});

test('Wheels catalogue fills the viewport and cards form aligned, equal-height responsive grid rows', async ({
  page,
}) => {
  const viewports = [
    { width: 1440, columns: 4 },
    { width: 1024, columns: 3 },
    { width: 600, columns: 2 },
    { width: 390, columns: 1 },
  ];

  for (const { width, columns } of viewports) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/wheels/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-product]')).toHaveCount(10);

    const layout = await page.evaluate(() => {
      const catalogue = document.querySelector<HTMLElement>('.wheels-catalogue')!;
      const grid = document.querySelector<HTMLElement>('#wheels-grid')!;
      const cards = [...grid.querySelectorAll<HTMLElement>('[data-product]')];
      const catalogueRect = catalogue.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      const cardRects = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, height: rect.height };
      });
      const tracks = getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/);
      const rows = new Map<number, number[]>();
      for (const rect of cardRects) {
        const row = Math.round(rect.top);
        rows.set(row, [...(rows.get(row) ?? []), rect.height]);
      }
      return {
        catalogueLeft: catalogueRect.left,
        catalogueRight: catalogueRect.right,
        catalogueWidth: catalogueRect.width,
        viewportWidth: document.documentElement.clientWidth,
        background: getComputedStyle(catalogue).backgroundColor,
        columns: tracks.length,
        gridLeft: gridRect.left,
        firstCardLeft: cardRects[0]?.left,
        cardLefts: cardRects.map((rect) => Math.round(rect.left)),
        rows: [...rows.values()],
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });

    expect(layout.catalogueLeft).toBeLessThanOrEqual(0.5);
    expect(layout.catalogueRight).toBeGreaterThanOrEqual(layout.viewportWidth - 0.5);
    expect(layout.catalogueWidth).toBeGreaterThanOrEqual(layout.viewportWidth - 0.5);
    expect(layout.background).toBe('rgb(240, 240, 242)');
    expect(layout.columns, `grid columns at ${width}px`).toBe(columns);
    expect(layout.firstCardLeft).toBeCloseTo(layout.gridLeft, 0);
    expect(layout.horizontalOverflow).toBe(false);

    for (const row of layout.rows) {
      expect(Math.max(...row) - Math.min(...row), `card heights at ${width}px`).toBeLessThanOrEqual(
        1,
      );
    }
    for (let index = 0; index < layout.cardLefts.length; index += columns) {
      const rowLefts = layout.cardLefts.slice(index, index + columns);
      expect(new Set(rowLefts).size).toBe(rowLefts.length);
    }
  }
});

test('Wheels catalogue filters, clears and sorts demo products', async ({ page }) => {
  await page.goto('/wheels/', { waitUntil: 'domcontentloaded' });
  await page.locator('#filter-construction').evaluate((element) => {
    (element as HTMLSelectElement).value = 'Forged';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('[data-product]')).toHaveCount(10);
  await page.locator('#filter-design').evaluate((element) => {
    (element as HTMLSelectElement).value = 'Eight-Spoke';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('[data-product]')).toHaveCount(1);
  await expect(page.locator('[data-product] .wheel-card__title')).toHaveText('SM-8RS');
  await expect(page).toHaveURL(/construction=forged/);
  await page.locator('#clear-filters').click();
  await expect(page.locator('[data-product]')).toHaveCount(10);
  await page.locator('#sort-products').evaluate((element) => {
    (element as HTMLSelectElement).value = 'az';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('[data-product] .wheel-card__title').first()).toHaveText('ARC-8RT');
});

test('Wheels mobile filter drawer applies filters and can be dismissed', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/wheels/', { waitUntil: 'domcontentloaded' });
  await page.locator('#mobile-filter-open').click();
  await expect(page.locator('#filter-drawer')).toHaveClass(/is-open/);
  await expect(page.locator('#mobile-filter-apply')).toBeVisible();
  await page.locator('#filter-mode').evaluate((element) => {
    (element as HTMLSelectElement).value = 'specification';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.locator('#filter-collection').evaluate((element) => {
    (element as HTMLSelectElement).value = 'Performance';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.locator('#mobile-filter-apply').click();
  await expect(page.locator('#filter-drawer')).not.toHaveClass(/is-open/);
  await expect(page.locator('[data-product]')).toHaveCount(3);
});

test('Wheels detail view shows technical specifications and does not invent a GLB', async ({
  page,
}) => {
  await page.goto('/wheels/?model=vs-5rs', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#wheel-detail')).toBeVisible();
  await expect(page.locator('#detail-title')).toHaveText('VS-5RS');
  await expect(page.locator('#detail-specs')).toContainText('5 × 120');
  await expect(page.locator('.wheel-detail__viewer')).toContainText('3D MODEL NOT AVAILABLE');
  await expect(page.locator('.wheel-detail__viewer')).not.toContainText('canvas');
});

test('Homepage wheel entry points resolve to the Wheels catalogue and its collection filters', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('p-button[href="/wheels/"]').first()).toHaveCount(1);
  await expect(page.locator('p-link-tile[href="/wheels/?collection=performance"]')).toHaveCount(1);
  await expect(page.locator('p-link-tile[href="/wheels/?collection=heritage"]')).toHaveCount(1);
});

test('Vehicle filter uses Wheel Size and transfers the selected fitment into specification filters', async ({
  page,
}) => {
  await page.route('**/api/wheel-size/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.split('/').filter(Boolean).at(-1);
    const payloads: Record<string, unknown> = {
      regions: [{ slug: 'usdm', name: 'United States' }],
      makes: [{ slug: 'bmw', name: 'BMW' }],
      models: [{ slug: '3-series', name: '3 Series' }],
      years: [{ slug: '2024', name: '2024' }],
      modifications: [{ slug: '330i', name: '330i' }],
      by_model: {
        data: [
          {
            is_oe: true,
            front: {
              rim: {
                diameter: 19,
                width: 8.5,
                offset: 25,
                bolt_pattern: '5x112',
                center_bore: 66.6,
              },
            },
            rear: {
              rim: {
                diameter: 19,
                width: 8.5,
                offset: 25,
                bolt_pattern: '5x112',
                center_bore: 66.6,
              },
            },
          },
        ],
      },
    };
    const key = path === 'by_model' ? 'by_model' : path;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payloads[key] ?? { data: [] }),
    });
  });
  await page.goto('/wheels/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#filter-region')).toBeEnabled();
  await page.locator('#filter-region').evaluate((element) => {
    (element as HTMLSelectElement).value = 'usdm';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#filter-make')).toBeEnabled();
  await page.locator('#filter-make').evaluate((element) => {
    (element as HTMLSelectElement).value = 'bmw';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#filter-model')).toBeEnabled();
  await page.locator('#filter-model').evaluate((element) => {
    (element as HTMLSelectElement).value = '3-series';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#filter-year')).toBeEnabled();
  await page.locator('#filter-year').evaluate((element) => {
    (element as HTMLSelectElement).value = '2024';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#filter-fitment')).toBeEnabled();
  await page.locator('#filter-fitment').evaluate((element) => {
    (element as HTMLSelectElement).value = '0';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#filter-mode')).toHaveJSProperty('value', 'specification');
  await expect(page.locator('#filter-diameter')).toHaveJSProperty('value', '19');
  await expect(page.locator('#filter-width')).toHaveJSProperty('value', '8.5');
  await expect(page.locator('#filter-pcd')).toHaveJSProperty('value', '5x112');
  await expect(page.locator('#filter-offset')).toHaveJSProperty('value', 'ET25');
  await expect(page.locator('#filter-bore')).toHaveJSProperty('value', '66.6');
});


test('Configure opens a product-specific form and submits an enquiry to the Worker API', async ({ page }) => {
  await page.goto('/wheels/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-product]').first().locator('a.wheel-card__action--secondary').click();
  await expect(page).toHaveURL(/\/configure\//);
  await expect(page.locator('#wheel-model')).toHaveText('VS-5RS');
  await expect(page.locator('#wheel-image')).toHaveAttribute('src', /cdn\.sanity\.io/);
  await page.locator('[name="front_diameter"]').fill('18');
  await page.locator('[name="front_width"]').fill('10');
  await page.locator('[name="front_offset"]').fill('25');
  await page.locator('[name="front_pcd"]').fill('5x120');
  await page.locator('[name="front_cb"]').fill('72.56');
  await page.locator('[name="customer_name"]').fill('Test Customer');
  await page.locator('[name="customer_email"]').fill('test@example.com');
  await page.locator('[name="quantity"]').fill('4');
  await page.route('**/api/wheel-inquiries', async (route) => {
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ok: true, reference: 'WR-TEST1234' }) });
  });
  await page.locator('#submit-wheel-enquiry').click();
  await expect(page.locator('#configure-status')).toContainText('WR-TEST1234');
});
