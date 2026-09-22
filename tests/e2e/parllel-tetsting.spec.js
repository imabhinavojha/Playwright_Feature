import { test } from '@playwright/test';

test.describe.parallel('Parallel Suite', () => {
  
  test('Test A', async ({ page }) => {
    await page.goto('https://example.com');
  });

  test('Test B', async ({ page }) => {
    await page.goto('https://google.com');
  });

});