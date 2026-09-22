const { test, expect } = require('@playwright/test');

// SRP: Each class has a single responsibility.

/*
Single Responsibility Principle ( SRP-Playwright.js ) : 
The LoginPage class is responsible for actions related to the login page, such as navigation and form filling.
The LoginValidator class is responsible for validations related to the login process, such as checking for successful 
login and login errors.
*/
// Page object for login actions
class LoginPage {
  constructor(page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto('/login');
  }

  async fillCredentials(username, password) {
    await this.page.fill('#username', username);
    await this.page.fill('#password', password);
  }

  async submit() {
    await this.page.click('#login');
  }
}

// Validator for login-related assertions
class LoginValidator {
  constructor(page) {
    this.page = page;
  }

  async isLoggedIn() {
    return await this.page.locator('.dashboard').isVisible();
  }

  async hasLoginError() {
      return await this.page.locator('.error').isVisible();
  }
}

// Test demonstrating SRP
test.describe('Login Functionality (SRP)', () => {
  test('should login successfully with correct credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const loginValidator = new LoginValidator(page);

    await loginPage.navigate();
    await loginPage.fillCredentials('user', 'password');
    await loginPage.submit();

    await expect(loginValidator.isLoggedIn()).resolves.toBe(true);
    console.log('Login test passed');
  });

  test('should show error with incorrect credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const loginValidator = new LoginValidator(page);

    await loginPage.navigate();
    await loginPage.fillCredentials('wrong-user', 'wrong-password');
    await loginPage.submit();

    await expect(loginValidator.hasLoginError()).resolves.toBe(true);
    console.log('Error validation test passed');
  });
});
  