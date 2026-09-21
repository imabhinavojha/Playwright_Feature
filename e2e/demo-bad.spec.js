// @ts-check
const { test, expect } = require('@playwright/test');

// Intentional mistakes for demo
const password = 'hardcoded-password';
const secretKey = 'sk_live_1234567890';

test.only('Demo: Bad Playwright practices', async ({ page }) => {
  // Missing await on goto
  page.goto('https://example.com');

  // Missing await on fill and click
  page.fill('#user', 'admin');
  page.fill('#pass', password);
  page.click('#login');

  // Arbitrary wait
  await page.waitForTimeout(3000);

  // Missing await on expectation
  expect(page.locator('.success')).toBeVisible();

  // Dangerous eval
  eval("alert('xss')");
});