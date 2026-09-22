const { test, expect } = require('@playwright/test');

test.setTimeout(60000); // Increase timeout for the whole file

/**
 * @file test-healing.spec.js
 * @description This file demonstrates the concept of "Self-Healing" tests in Playwright.
 * 
 * "Test Healing" refers to the ability of a test to recover when a primary locator fails,
 * usually by falling back to alternative selectors or using AI-driven logic.
 */

/**
 * Utility function for self-healing locators.
 * It attempts to find an element using a list of selectors and returns the first one that works.
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string[]} selectors - Array of selectors to try in order
 * @param {number} timeoutPerSelector - Timeout for each attempt in ms
 */
async function getHealedLocator(page, selectors, timeoutPerSelector = 2000) {
  for (const selector of selectors) {
    try {
      console.log(`🔍 Attempting to find element with selector: ${selector}`);
      const locator = page.locator(selector);
      // Wait for the element to be visible or attached within the short timeout
      await locator.waitFor({ state: 'visible', timeout: timeoutPerSelector });
      console.log(`✅ Found element with selector: ${selector}`);
      return locator;
    } catch (error) {
      console.warn(`⚠️ Failed to find element with: ${selector}. Trying next fallback...`);
    }
  }
  throw new Error(`❌ All selectors failed for healing. Tried: ${selectors.join(', ')}`);
}

test.describe('Self-Healing Test Demonstration', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to a reliable test site
    // Using a 60s timeout for navigation to handle slow networks
    await page.goto('https://the-internet.herokuapp.com/login', { timeout: 60000 });
  });

  test('Demonstrate Self-Healing with Fallback Selectors', async ({ page }) => {
    /**
     * Scenario: Imagine the primary selector (maybe a brittle CSS path) changes.
     * We provide fallbacks like Role, Label, or Text which are more stable.
     */
    
    // List of selectors for the Username field
    const usernameSelectors = [
      '#invalid-username-id', // This will fail (simulated change)
      'input[name="username"]', // Secondary CSS
      'internal:label="Username"i', // Playwright's stable label locator
      '#username' // ID (usually stable)
    ];

    console.log('--- Testing Healing for Username Field ---');
    const usernameField = await getHealedLocator(page, usernameSelectors);
    await usernameField.fill('tomsmith');

    // List of selectors for the Password field
    const passwordSelectors = [
      '.wrong-password-class', // This will fail
      'input[type="password"]', // Type-based
      'internal:label="Password"i',
      '#password'
    ];

    console.log('\n--- Testing Healing for Password Field ---');
    const passwordField = await getHealedLocator(page, passwordSelectors);
    await passwordField.fill('SuperSecretPassword!');

    // List of selectors for Login button
    const loginButtonSelectors = [
      'button.radius', // CSS class
      'text=Login', // Text-based
      'role=button[name="Login"]', // Role-based (Best Practice)
      'button[type="submit"]'
    ];

    console.log('\n--- Testing Healing for Login Button ---');
    const loginButton = await getHealedLocator(page, loginButtonSelectors);
    await loginButton.click();

    // Verify successful login
    await expect(page.locator('#flash')).toContainText('You logged into a secure area!');
  });

  test('Playwright Native Resiliency (Built-in Healing)', async ({ page }) => {
    /**
     * Playwright doesn't need external "healing" if we use its recommended locators.
     * These are resilient to DOM changes because they focus on user-facing attributes.
     */
    
    console.log('--- Using Playwright Native Resilient Locators ---');
    
    // Instead of complex CSS/XPath, use role/label
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page.locator('#flash')).toContainText('You logged into a secure area!');
    
    console.log('✅ Native locators successfully handled the interaction.');
  });

});
