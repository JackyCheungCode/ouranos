import { expect, test } from '@playwright/test';

test('OURANOS forged wheels page presents its brand-led specification story', async ({ page }) => {
  await page.goto('/forged-wheels/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle(/OURANOS \| Forged Wheels/);
  await expect(page.locator('.ouranos-header')).toHaveAttribute('data-header-variant', 'overlay');
  await expect(page.locator('#ouranos-ai-open')).toBeVisible();
  await expect(page.locator('#ouranos-language-trigger')).toBeVisible();
  await expect(page.locator('#ouranos-theme-toggle')).toHaveCount(0);
  await expect(page.locator('#ouranos-search')).toHaveCount(0);
  await expect(page.locator('html')).toHaveClass(/scheme-light/);
  await expect(page.locator('#ouranos-ai-panel')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#ouranos-ai-panel')).toHaveCSS('position', 'fixed');
  await expect(page.locator('#ouranos-ai-panel')).toHaveCSS('visibility', 'hidden');

  const firstPaintGeometry = await page.evaluate(() => ({
    headerTop: document.querySelector('.ouranos-header')?.getBoundingClientRect().top,
    heroTop: document.querySelector('.forged-hero')?.getBoundingClientRect().top,
  }));
  expect(firstPaintGeometry.headerTop).toBe(0);
  expect(firstPaintGeometry.heroTop).toBe(0);

  await page.locator('#ouranos-ai-panel').evaluate((panel) => panel.classList.add('is-open'));
  await expect(page.locator('#ouranos-ai-panel')).toHaveCSS('visibility', 'visible');
  await page.locator('#ouranos-ai-panel').evaluate((panel) => panel.classList.remove('is-open'));
  await expect(page.locator('#ouranos-ai-panel')).toHaveCSS('visibility', 'hidden');

  await expect(page.locator('#forged-hero-title')).toContainText('ENGINEERED');
  await expect(page.locator('.forged-hero__video source')).toHaveAttribute(
    'src',
    '/videos/mood-porsche-gts.mp4',
  );
  await expect(page.locator('#approach-title')).toContainText('Not simply made to fit.');
  await expect(page.locator('#architecture-title')).toBeVisible();
  await expect(page.locator('#specification-title')).toBeVisible();
  await expect(page.locator('#individualization-title')).toBeVisible();
  await expect(page.locator('#fitment-title')).toBeVisible();
  await expect(page.locator('#commissioning-title')).toBeVisible();
  await expect(page.locator('#faq-title')).toBeVisible();

  const sectionOrder = await page
    .locator('main.forged-page > section')
    .evaluateAll((sections) => sections.map((section) => section.classList[0]));
  expect(sectionOrder).toEqual([
    'forged-hero',
    'forged-approach',
    'forged-architecture',
    'forged-specification',
    'forged-individualization',
    'forged-fitment',
    'forged-commissioning',
    'forged-faq',
    'forged-final',
  ]);

  await expect(page.locator('.forged-specification__matrix > div')).toHaveCount(6);
  await expect(page.locator('.forged-detail')).toHaveCount(4);
  await expect(
    page.locator('.forged-hero .forged-hero__content .forged-hero__actions p-link'),
  ).toHaveCount(2);
  await expect(page.locator('.forged-final__content p-link')).toHaveCount(2);
  await expect(page.locator('.forged-image-note').first()).toContainText('visual references');
  await expect(page.locator('#forged-video-toggle')).toBeVisible();

  await page.goto('/wheels/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#wheels-grid')).toBeVisible();
  await expect(page.locator('#catalogue-title')).toBeVisible();
});

test('forged wheels page remains responsive and navigation exposes the destination', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/forged-wheels/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#ouranos-ai-open')).toBeVisible();
  await expect(page.locator('#nav-button')).toBeVisible();
  await page.locator('#nav-button').click();
  await expect(page.locator('#nav-drilldown')).toHaveJSProperty('open', true);
  await expect(
    page.locator(
      '#nav-drilldown p-drilldown-item[identifier="ouranos-wheels"] a[href="/forged-wheels/"]',
    ),
  ).toHaveCount(1);

  await expect(page.locator('.forged-detail-grid')).toBeVisible();
  const pageWidth = await page.locator('body').evaluate((element) => element.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(pageWidth).toBeLessThanOrEqual(viewportWidth);
});
