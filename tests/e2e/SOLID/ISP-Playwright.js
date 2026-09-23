const { test, expect } = require('@playwright/test');

// ISP: Clients should not be forced to depend on interfaces they do not use.

/*
Interface Segregation Principle ( ISP-Playwright.js ) : 
The Navigable and FormInteractable interfaces are segregated, and the LoginUITest class depends only on the methods it needs. 
This ensures that changes in one interface do not affect the other.
*/

// Interface for navigation actions
class Navigable {
  constructor(page) {
    this.page = page;
  }
  async navigate(url) {
    await this.page.goto(url);
  }
}

// Interface for form interaction
class FormInteractable {
  constructor(page) {
    this.page = page;
  }
  async fill(selector, text) {
    await this.page.fill(selector, text);
  }
  async submit(selector) {
    await this.page.click(selector);
  }
}

// Interface for API validation
class ApiValidatable {
    constructor(request) {
        this.request = request;
    }
    async fetchAndValidate(url, schema) {
        const response = await this.request.get(url);
        const data = await response.json();
        // Here you would use a schema validator like Zod or Ajv
        expect(data).toMatchObject(schema); // Simplified for example
    }
}

// A UI test class that uses navigation and form interaction
class LoginUITest {
  constructor(page) {
    this.navigation = new Navigable(page);
    this.form = new FormInteractable(page);
  }

  async performLogin(username, password) {
    await this.navigation.navigate('/login');
    await this.form.fill('#username', username);
    await this.form.fill('#password', password);
    await this.form.submit('#login');
  }
}

// An API test class that only uses API validation
class UserApiTest {
    constructor(request) {
        this.validator = new ApiValidatable(request);
    }

    async validateUserEndpoint() {
        const userSchema = { id: expect.any(Number), name: expect.any(String) };
        await this.validator.fetchAndValidate('/api/user/1', userSchema);
    }
}

// Tests demonstrating ISP
test.describe('Testing Principles (ISP)', () => {
  test('UI Login Test should not depend on API validation', async ({ page }) => {
    const loginTest = new LoginUITest(page);
    await loginTest.performLogin('user', 'password');
    await expect(page.locator('.dashboard')).toBeVisible();
    console.log('ISP UI test passed');
  });

  test('API User Test should not depend on UI interactions', async ({ request }) => {
    const apiTest = new UserApiTest(request);
    await apiTest.validateUserEndpoint();
    console.log('ISP API test passed');
  });
});
  