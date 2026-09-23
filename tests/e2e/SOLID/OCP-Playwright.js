const { test, expect } = require('@playwright/test');

// OCP: Open for extension, closed for modification.
/*
Open/Closed Principle ( OCP-Playwright.js ) : The AuthStrategy class is open for extension (e.g.,
using different authentication methods) but closed for modification. This ensures that existing code doesn't need to be 
changed when new authentication strategies are added.
*/

// Base class for authentication strategies
class AuthStrategy {
  async authenticate(page) {
    throw new Error('Authentication strategy not implemented');
  }
}

// Strategy for username/password authentication
class UsernamePasswordAuth extends AuthStrategy {
  constructor(username, password) {
    super();
    this.username = username;
    this.password = password;
  }

  async authenticate(page) {
    await page.fill('#username', this.username);
    await page.fill('#password', this.password);
    await page.click('#login');
  }
}

// Strategy for OAuth authentication
class OAuthAuth extends AuthStrategy {
    constructor(provider) {
        super();
        this.provider = provider; // e.g., 'google', 'github'
    }

  async authenticate(page) {
    await page.click(`#oauth-${this.provider}`);
  }
}

// Test runner that uses a strategy
class LoginTest {
  constructor(strategy) {
    this.strategy = strategy;
  }

  async run(page) {
    await this.strategy.authenticate(page);
  }
}

// Tests demonstrating OCP
test.describe('Login Functionality (OCP)', () => {
  test('should login using username and password', async ({ page }) => {
    const userPassAuth = new UsernamePasswordAuth('user', 'password');
    const loginTest = new LoginTest(userPassAuth);

    await page.goto('/login');
    await loginTest.run(page);

    await expect(page.locator('.dashboard')).toBeVisible();
    console.log('Username/Password login test passed');
  });

  test('should initiate OAuth login', async ({ page }) => {
    const oauthAuth = new OAuthAuth('google');
    const loginTest = new LoginTest(oauthAuth);

    await page.goto('/login');
    await loginTest.run(page);

    // Assuming OAuth redirects to a new page
    await expect(page).toHaveURL(/.*google.com/);
    console.log('OAuth login test passed');
  });
});
  