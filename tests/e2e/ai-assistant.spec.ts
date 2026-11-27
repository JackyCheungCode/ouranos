import { expect, test } from '@playwright/test';

test('OURANOS AI renders structured content and carries confirmed selections into the next turn', async ({
  page,
}) => {
  let calls = 0;
  await page.route('**/api/ai/chat', async (route) => {
    calls += 1;
    const body =
      calls === 1
        ? {
            ui: {
              type: 'assistant_message',
              content: [
                { type: 'text', value: 'Choose a wheel specification.' },
                {
                  type: 'selection',
                  title: 'Wheel size',
                  options: [
                    { label: '20 × 9J', value: '20 × 9J', description: 'Front' },
                    { label: '20 × 10J', value: '20 × 10J', description: 'Rear' },
                  ],
                },
                {
                  type: 'comparison_table',
                  columns: ['Specification', 'Option'],
                  rows: [['Diameter', '20 inch']],
                },
              ],
            },
            model: 'test-model',
            sources: [],
          }
        : {
            message: 'Selection received. Let us verify fitment.',
            model: 'test-model',
            sources: [],
          };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#ouranos-ai-open').click();
  await page.locator('#ouranos-ai-input').fill('Show me wheel sizes.');
  await page.locator('#ouranos-ai-form button[type="submit"]').click();
  await expect(page.locator('#ouranos-ai-messages')).toContainText('Choose a wheel specification.');
  await expect(page.locator('.ouranos-ai-table')).toBeVisible();
  await page.locator('.ouranos-ai-choice input').first().check();
  await page.getByRole('button', { name: 'Confirm selection' }).click();
  await expect(page.locator('#ouranos-ai-messages')).toContainText(
    'Selection received. Let us verify fitment.',
  );
  await expect.poll(async () => calls).toBe(2);
});
