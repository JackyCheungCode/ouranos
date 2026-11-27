import { expect, test } from '@playwright/test';

test('shared navigation opens the OURANOS AI panel and sends a chat message', async ({ page }) => {
  await page.route('**/api/ai/chat', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Please provide your vehicle year, make and model.', model: 'test-model', sources: [] }),
    });
  });

  await page.goto('/');
  const open = page.locator('#ouranos-ai-open');
  const panel = page.locator('#ouranos-ai-panel');
  await expect(open).toHaveCount(1);
  await open.click();
  await expect(panel).toHaveClass(/is-open/);
  await expect(panel).toHaveAttribute('aria-hidden', 'false');

  await page.locator('#ouranos-ai-input').fill('Will these wheels fit my car?');
  await page.locator('#ouranos-ai-form button[type="submit"]').click();
  await expect(panel).toContainText('Please provide your vehicle year, make and model.');

  await page.locator('#ouranos-ai-close').click();
  await expect(panel).toHaveAttribute('aria-hidden', 'true');
});
