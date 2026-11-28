import { expect, test } from '@playwright/test';

test('forged wheels landing page follows the seven-section business brief', async ({ page }) => {
  await page.goto('/forged-wheels/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle(/OURANOS \| Forged Wheel Engineering/);
  await expect(page.locator('.ouranos-header')).toHaveAttribute('data-header-variant', 'overlay');
  await expect(page.locator('#ouranos-ai-open')).toBeVisible();
  await expect(page.locator('#ouranos-language-trigger')).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/scheme-light/);

  const headerGeometry = await page.locator('.ouranos-header').evaluate((element) => ({
    top: element.getBoundingClientRect().top,
    position: getComputedStyle(element).position,
  }));
  expect(headerGeometry.top).toBe(0);
  expect(headerGeometry.position).toBe('absolute');

  const sectionIds = await page
    .locator('main.forged-page > section')
    .evaluateAll((items) => items.map((item) => item.id));
  expect(sectionIds).toEqual([
    '',
    'solutions',
    'manufacturing',
    'product-lineup',
    'fitment-gallery',
    'aftercare',
    'enquiry',
  ]);

  await expect(page.locator('#forged-hero-title')).toContainText('Forged to perform.');
  await expect(page.locator('.forged-trustbar > div')).toHaveCount(4);
  await expect(page.locator('.forged-pain__list p-accordion')).toHaveCount(4);
  await expect(page.locator('#manufacturing-stepper button[role="tab"]')).toHaveCount(6);
  await expect(page.locator('.forged-brand-logo:not([aria-hidden="true"])')).toHaveCount(30);
  await expect(page.locator('.forged-brand-marquee')).toHaveCount(2);
  const logoFilters = await page
    .locator('.forged-brand-logo img')
    .evaluateAll((images) => images.map((image) => getComputedStyle(image).filter));
  expect(logoFilters.every((filter) => filter !== 'grayscale(1)')).toBe(true);
  await expect(page.locator('.forged-certification-mark img')).toHaveCount(2);
  const headerVideo = page.locator('.ouranos-header__video-embed');
  await expect(headerVideo).toBeAttached();
  await expect(headerVideo).toHaveAttribute(
    'src',
    /youtube-nocookie\.com\/embed\/mGJGwe1cPo0/,
  );
  await expect(headerVideo).toHaveAttribute('title', 'FLEXIFORGED forged wheel CNC milling process');
  await expect(page.locator('.forged-construction-panel')).toHaveCount(4);
  await expect(page.locator('p-carousel')).toBeVisible();
  await expect(page.locator('.forged-certifications__list')).toBeVisible();
  await expect(page.locator('.forged-fitment-card')).toHaveCount(5);
  await expect(page.locator('.forged-aftercare__grid article')).toHaveCount(3);
  await expect(page.locator('#forged-enquiry-form')).toBeVisible();

  await page.locator('#manufacturing-stepper button[role="tab"]').nth(3).click();
  await expect(page.locator('#process-title')).toHaveText('Surface preparation & finishing');
  await expect(page.locator('#process-index')).toHaveText('04 / 06');
  await page.locator('#manufacturing-stepper button[role="tab"]').nth(5).click();
  await expect(page.locator('#process-title')).toHaveText('Laboratory and durability testing');

  await page.locator('#construction-tabs').evaluate((element) => {
    element.dispatchEvent(new CustomEvent('update', { detail: { activeTabIndex: 2 } }));
  });
  await expect(page.locator('.forged-construction-panel[data-panel="2"]')).toBeVisible();
  await expect(page.locator('.forged-construction-panel[data-panel="0"]')).toBeHidden();

  await page.locator('#vehicle-filter').evaluate((element) => {
    element.dispatchEvent(new CustomEvent('change', { detail: { value: 'porsche' } }));
  });
  await expect(page.locator('.forged-fitment-card[data-vehicle="porsche"]')).toBeVisible();
  await expect(page.locator('.forged-fitment-card[data-vehicle="bmw"]')).toBeHidden();

  await expect(page.locator('#reference-image')).toHaveAttribute(
    'accept',
    'image/jpeg,image/png,image/webp',
  );
  await page.locator('[data-case="porsche"]').click();
  await expect(page.locator('#fitment-flyout')).toHaveJSProperty('open', true);
  await page.locator('#fitment-flyout-enquire').click();
  const fitmentNote = await page
    .locator('#notes')
    .evaluate((element) => (element as HTMLTextAreaElement).value);
  expect(fitmentNote).toContain('PORSCHE');
  await page.locator('#warranty-details').click();
  await expect(page.locator('#warranty-modal')).toHaveJSProperty('open', true);
  await page.locator('#warranty-modal-close').click();
  await expect(page.locator('#warranty-modal')).toHaveJSProperty('open', false);
});

test('forged wheels enquiry supports a one-set private owner enquiry and responsive layout', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/forged-wheels/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#ouranos-ai-open')).toBeVisible();
  await expect(page.getByText('Enquiry type', { exact: true })).toHaveCount(0);
  await expect(page.locator('#customer-type')).toHaveCount(0);
  await expect(page.locator('[name="customer_company"], [name="business_type"]')).toHaveCount(0);

  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.locator('#forged-submit')).toBeVisible();
  await expect(page.locator('.forged-swatch .swatch').first()).toHaveCSS('border-radius', '50%');
  await expect(page.locator('.forged-form-grid label:has(> p-input-text) > span')).toHaveCount(0);
});
