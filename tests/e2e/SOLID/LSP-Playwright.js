const { test, expect } = require('@playwright/test');

// LSP: Subtypes must be substitutable for their base types.
/*
Liskov Substitution Principle ( LSP-Playwright.js ) : The Header and Footer classes are subtypes of PageComponent, 
and they can be used interchangeably in the checkComponentVisibility function without affecting the expected results.
*/

// A base class for a page component
class PageComponent {
  constructor(page) {
    this.page = page;
  }

  async isVisible() {
    throw new Error('Visibility check not implemented');
  }
}

// A specific component: Header
class Header extends PageComponent {
  async isVisible() {
    return await this.page.locator('header').isVisible();
  }

  async getTitle() {
    return await this.page.locator('header h1').textContent();
  }
}

// Another component: Footer
class Footer extends PageComponent {
  async isVisible() {
    return await this.page.locator('footer').isVisible();
  }

  async getCopyright() {
    return await this.page.locator('footer .copyright').textContent();
  }
}

// A function that works with any PageComponent
async function checkComponentVisibility(component) {
  await expect(component.isVisible()).resolves.toBe(true);
}

// Tests demonstrating LSP
test.describe('Component Visibility (LSP)', () => {
  test('should verify header and footer visibility', async ({ page }) => {
    const header = new Header(page);
    const footer = new Footer(page);

    await page.goto('/some-page'); // A page where header and footer are present

    // The same function works for both Header and Footer
    await checkComponentVisibility(header);
    await checkComponentVisibility(footer);

    // Additional checks specific to each type
    await expect(header.getTitle()).resolves.toBe('My Application');
    await expect(footer.getCopyright()).resolves.toContain('2024');

    console.log('LSP test passed for Header and Footer');
  });
});
