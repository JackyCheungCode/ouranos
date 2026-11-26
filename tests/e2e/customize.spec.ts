import { expect, test } from '@playwright/test';

test('Bespoke studio exposes forged-only configuration and saves design drafts', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/customize/');

  await expect(page).toHaveTitle('Ouranos | Bespoke Forged Wheel Studio');
  await expect(page.getByRole('heading', { name: /Your vision/i })).toBeVisible();
  await expect(page.locator('.locked-choice')).toContainText('Forged');
  await expect(page.locator('.design-choice')).toHaveCount(4);

  await page.locator('.design-choice[data-design^="Mono"]').click();
  await expect(page.locator('#summary-design')).toHaveText('Mono / 6 Spoke');

  await page.locator('#next-button').click();
  await expect(page.locator('[data-panel="1"]')).toBeVisible();
  await page.locator('#diameter').selectOption('21');
  await expect(page.locator('#summary-dimension')).toHaveText('21 × 9.0 in');

  await page.locator('.step-tab[data-step="2"]').click();
  await page.locator('.finish-choice[data-finish="bronze"]').click();
  await expect(page.locator('#summary-finish')).toHaveText('Champagne Bronze');

  await page.reload();
  await expect(page.locator('#summary-design')).toHaveText('Mono / 6 Spoke');
  await expect(page.locator('#diameter')).toHaveValue('21');
  await expect(page.locator('#summary-finish')).toHaveText('Champagne Bronze');
  expect(errors).toEqual([]);
});

test('Bespoke studio captures vehicle and contact details before preparing a specification', async ({
  page,
}) => {
  await page.goto('/customize/');
  await page.locator('.step-tab[data-step="3"]').click();
  await page.locator('#customer-name').fill('Test Customer');
  await page.locator('#customer-email').fill('customer@example.com');
  await page.locator('#submit-button').click();

  await expect(page.locator('#submission-message')).toBeVisible();
  await expect(page.locator('#submission-message')).toContainText(
    'Your configuration has not been transmitted',
  );
  await expect(page.locator('#submission-message')).toContainText('DOWNLOAD CONFIGURATION');
});
