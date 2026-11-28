import { expect, test } from '@playwright/test';

test('Cast Wheels capability page follows the five-module brief and shared navigation', async ({
  page,
}) => {
  await page.goto('/cast-wheels/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle(/OURANOS \| Cast Wheel Engineering/);
  await expect(page.locator('.ouranos-header')).toHaveAttribute('data-header-variant', 'overlay');
  await expect(page.locator('#ouranos-ai-open')).toBeVisible();
  await expect(page.locator('#ouranos-language-trigger')).toBeVisible();
  await expect(page.locator('.ouranos-header__video')).toBeHidden();
  await expect(page.locator('html')).toHaveClass(/scheme-light/);
  await expect(page.locator('main.cast-page')).toBeVisible();
  await expect(page.locator('main.cast-page > header, main.cast-page > footer')).toHaveCount(0);
  await expect(page.locator('.ouranos-header a[href="/cast-wheels/"]')).toHaveCount(1);
  await expect(page.locator('#nav-drilldown')).toContainText('Forged Wheels');
  await expect(page.locator('#nav-drilldown')).toContainText('Cast Wheels');

  await expect(page.locator('#cast-hero-title')).toContainText(
    'Cast wheels. Engineered with intent.',
  );
  await expect(page.locator('.cast-proof > div')).toHaveCount(3);
  await expect(page.locator('.cast-risk')).toHaveCount(3);
  await expect(page.locator('.cast-table p-table-row')).toHaveCount(5);
  await expect(page.locator('.cast-assurance__accordions p-accordion')).toHaveCount(4);
  await expect(page.locator('#cast-inquiry-form')).toBeVisible();

  const firstAccordion = page.locator('.cast-assurance__accordions p-accordion').first();
  await expect(firstAccordion).toHaveJSProperty('open', true);

  await page.locator('#cast-audience-switch p-segmented-control-item[value="driver"]').click();
  await expect(page.locator('#cast-takeaway-title')).toHaveText(
    'Engineering Verdict for Street & Daily Builds',
  );
  await expect(page.locator('#cast-audience-takeaway')).toContainText(
    'budget for tyres and suspension',
  );

  await page.locator('#cast-inquiry-mode p-segmented-control-item[value="wholesale"]').click();
  await expect(page.locator('#cast-specs')).toHaveAttribute(
    'placeholder',
    'e.g. European Market 5x112, 18"-19", 20GP Trial Order',
  );
  await expect(page.locator('#cast-spec-label')).toHaveText('Target Market / PCDs');
  await page.locator('#cast-inquiry-mode p-segmented-control-item[value="fitment"]').click();
  await expect(page.locator('#cast-specs')).toHaveAttribute(
    'placeholder',
    'e.g. 2023 BMW M340i — Front 374mm Brembo',
  );

  const smoothScroll = await page
    .locator('html')
    .evaluate((element) => getComputedStyle(element).scrollBehavior);
  expect(smoothScroll).toBe('smooth');
});

test('Cast Wheels consultation validates email-or-WhatsApp and submits a real inquiry payload', async ({
  page,
}) => {
  await page.goto('/cast-wheels/', { waitUntil: 'domcontentloaded' });

  await page.locator('#cast-name').evaluate((element) => {
    (element as HTMLInputElement).value = 'Alex Morgan / Apex Performance';
  });
  await page.locator('#cast-whatsapp').evaluate((element) => {
    (element as HTMLInputElement).value = '+1 555 019 2834';
  });
  await page.locator('#cast-specs').evaluate((element) => {
    (element as HTMLInputElement).value = '2023 BMW M340i — Front 374mm Brembo';
  });
  await page.locator('#cast-details').evaluate((element) => {
    (element as HTMLTextAreaElement).value = 'Check front caliper clearance and ET.';
  });

  let submittedPayload: Record<string, unknown> | null = null;
  await page.route('**/api/wheel-inquiries', async (route) => {
    submittedPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, reference: 'WR-CAST1234' }),
    });
  });

  await page.locator('#cast-submit').click();
  await expect(page.locator('#cast-form-feedback')).toBeVisible();
  await expect(page.locator('#cast-form-feedback')).toContainText('WR-CAST1234');
  expect(submittedPayload).toMatchObject({
    product: {
      id: 'ouranos-cast-wheel-consultation',
      model: 'Cast wheel engineering consultation',
      construction: 'Cast',
    },
    customer_name: 'Alex Morgan / Apex Performance',
    customer_email: '',
    customer_phone: '+1 555 019 2834',
    quantity: 1,
  });
  expect(String(submittedPayload?.notes)).toContain('2023 BMW M340i');
});

test('Cast Wheels consultation requires a valid contact channel', async ({ page }) => {
  await page.goto('/cast-wheels/', { waitUntil: 'domcontentloaded' });
  await page.locator('#cast-name').evaluate((element) => {
    (element as HTMLInputElement).value = 'Alex Morgan';
  });
  await page.locator('#cast-submit').click();
  await expect(page.locator('#cast-contact-error')).toBeVisible();
  await expect(page.locator('#cast-form-feedback')).toBeHidden();
});
