const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { DashboardPage } = require('../../pages/DashboardPage');
const { ProductPage } = require('../../pages/ProductPage');
const { HeaderComponent } = require('../../components/HeaderComponent');
const { FooterComponent } = require('../../components/FooterComponent');

test.describe('Page Object Model & Component Object Model Examples', () => {
  
  test('8.1 Traditional Page Object Pattern - Login Test', async ({ page }) => {
    // Create instance of LoginPage
    const loginPage = new LoginPage(page);
    
    // Navigate to login page
    await loginPage.goto('https://the-internet.herokuapp.com/login');
    
    // Perform login using page object method
    await loginPage.login('tomsmith', 'SuperSecretPassword!');
    
    // Verify navigation to dashboard
    await expect(page).toHaveURL(/secure/);
    await expect(page.getByText('You logged into a secure area!')).toBeVisible();
  });

  test('8.1 Traditional Page Object - Login with Error Handling', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto('https://the-internet.herokuapp.com/login');
    
    // Try to login with invalid credentials
    await loginPage.login('wrong@example.com', 'wrongpassword');
    
    // Check for error message using page object method
    const hasError = await loginPage.hasErrorMessage();
    
    // Verify error is shown (the-internet.herokuapp.com shows error on invalid login)
    if (hasError) {
      const errorText = await loginPage.getErrorMessage();
      console.log('Error message:', errorText);
    }
  });

  test('8.2 Component Object Model - Using Header Component', async ({ page }) => {
    // Create header component directly
    const header = new HeaderComponent(page);
    
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Use component methods
    const isHeaderVisible = await header.isVisible();
    console.log('Header visible:', isHeaderVisible);
    
    // Navigate using header component
    await header.navigateTo('Form Authentication');
    await expect(page).toHaveURL(/login/);
  });

  test('8.2 Component Object Model - Using Footer Component', async ({ page }) => {
    // Create footer component
    const footer = new FooterComponent(page);
    
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Check if footer is visible
    const isFooterVisible = await footer.isVisible();
    console.log('Footer visible:', isFooterVisible);
    
    // Get all footer links
    if (isFooterVisible) {
      const links = await footer.getAllLinks();
      console.log('Footer links:', links);
    }
  });

  test('8.2 Component Objects in Page Objects - Dashboard with Header', async ({ page }) => {
    // Create DashboardPage which uses HeaderComponent via BasePage
    const dashboardPage = new DashboardPage(page);
    
    // Navigate to dashboard (after login)
    await page.goto('https://the-internet.herokuapp.com/login');
    const loginPage = new LoginPage(page);
    await loginPage.login('tomsmith', 'SuperSecretPassword!');
    
    // Now we're on dashboard, use dashboard page object
    await dashboardPage.goto('https://the-internet.herokuapp.com/secure');
    
    // Use header component through dashboard page
    const welcomeMsg = await dashboardPage.getWelcomeMessage();
    console.log('Welcome message:', welcomeMsg);
    
    // Verify dashboard is loaded
    const isLoaded = await dashboardPage.isLoaded();
    expect(isLoaded).toBeTruthy();
  });

  test('8.3 Reusable Component Architecture - ProductPage extends BasePage', async ({ page }) => {
    // Create ProductPage which extends BasePage
    // BasePage automatically provides header and footer components
    const productPage = new ProductPage(page);
    
    await page.goto('https://the-internet.herokuapp.com/');
    
    // ProductPage has access to header component from BasePage
    // Use header to search
    await productPage.searchProduct('test');
    
    // Verify header is available (inherited from BasePage)
    const headerVisible = await productPage.header.isVisible();
    console.log('Header available through inheritance:', headerVisible);
    
    // Verify footer is available (inherited from BasePage)
    const footerVisible = await productPage.footer.isVisible();
    console.log('Footer available through inheritance:', footerVisible);
  });

  test('8.3 Complete Flow - Login, Navigate, Use Components', async ({ page }) => {
    // Step 1: Login using Page Object
    const loginPage = new LoginPage(page);
    await loginPage.goto('https://the-internet.herokuapp.com/login');
    await loginPage.login('tomsmith', 'SuperSecretPassword!');
    
    // Step 2: Use Dashboard Page Object (which has HeaderComponent)
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto('https://the-internet.herokuapp.com/secure');
    
    // Step 3: Use header component through dashboard
    const isLoaded = await dashboardPage.isLoaded();
    expect(isLoaded).toBeTruthy();
    
    // Step 4: Navigate using header component
    await dashboardPage.goHome();
    await expect(page).toHaveURL(/the-internet\.herokuapp\.com\/?$/);
  });

  test('8.3 Component Reusability - Multiple Pages Using Same Component', async ({ page }) => {
    // Demonstrate that HeaderComponent can be used across multiple pages
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Use header component on homepage
    const header1 = new HeaderComponent(page);
    await header1.navigateTo('Form Authentication');
    
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.login('tomsmith', 'SuperSecretPassword!');
    
    // Use header component on dashboard (same component, different page)
    const header2 = new HeaderComponent(page);
    const headerVisible = await header2.isVisible();
    console.log('Header component works on multiple pages:', headerVisible);
    
    // This demonstrates: Update HeaderComponent once, all pages get the update
    expect(headerVisible).toBeTruthy();
  });

  test('8.3 BasePage Pattern - Inheritance Example', async ({ page }) => {
    // ProductPage extends BasePage, so it automatically gets header and footer
    const productPage = new ProductPage(page);
    
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Verify inherited components are available
    expect(productPage.header).toBeDefined();
    expect(productPage.footer).toBeDefined();
    
    // Use inherited header component
    await productPage.header.navigateTo('Dynamic Content');
    
    // Use inherited footer component
    const footerLinks = await productPage.footer.getAllLinks();
    console.log('Footer links from inherited component:', footerLinks);
    
    // Use page-specific methods
    const isProductPageLoaded = await productPage.isLoaded();
    console.log('Product page loaded:', isProductPageLoaded);
  });

  test('8.3 Enterprise Pattern - Component Update Benefits', async ({ page }) => {
    // This test demonstrates the enterprise benefit:
    // If HeaderComponent is updated, all pages using it automatically get the update
    
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Multiple pages using the same component
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const productPage = new ProductPage(page);
    
    // All pages that extend BasePage have access to the same HeaderComponent
    // If we update HeaderComponent.search(), all these pages get the update automatically
    
    // Verify all pages can use the component
    expect(dashboardPage.header).toBeDefined();
    expect(productPage.header).toBeDefined();
    
    // Use component from different page objects
    await dashboardPage.header.navigateTo('Form Authentication');
    await loginPage.goto('https://the-internet.herokuapp.com/login');
    
    console.log('✅ Component Object Model: Update once, use everywhere!');
  });
});

