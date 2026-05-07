import { expect, test } from '@playwright/test';

test('home renderiza título FastKudos', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /fastkudos/i })).toBeVisible();
});
