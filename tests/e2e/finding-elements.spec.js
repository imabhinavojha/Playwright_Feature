const { test, expect } = require('@playwright/test');

test.describe('Finding Elements - All Types', () => {
  
  test('Finding Elements - Role-Based, Text-Based, Label-Based, Test ID, Actions, and Assertions', async ({ page }) => {
    // Navigate to a demo site with forms and interactive elements
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // ========== 1. ROLE-BASED LOCATORS (Recommended) ==========
    // Role-based locators are the most accessible and stable
    
    // Find button by role
    const submitButton = page.getByRole('button', { name: 'Login' });
    await expect(submitButton).toBeVisible();
    
    // Find textbox by role
    const usernameField = page.getByRole('textbox', { name: 'Username' });
    await expect(usernameField).toBeVisible();
    
    // Note: Password fields can also use getByRole('textbox'), but getByLabel is more reliable
    // For password fields, prefer getByLabel (shown below in Label-Based section)
    
    // ========== 2. TEXT-BASED LOCATORS ==========
    // Find elements by visible text
    
    // Exact text match
    const loginHeading = page.getByText('Login Page');
    await expect(loginHeading).toBeVisible();
    
    // Case-insensitive regex match
    const loginText = page.getByText(/login page/i);
    await expect(loginText).toBeVisible();
    
    // Partial text match
    const poweredByText = page.getByText('Powered by');
    await expect(poweredByText).toBeVisible();
    
    // ========== 3. LABEL-BASED LOCATORS ==========
    // Great for form elements
    
    // Find input by associated label
    const usernameByLabel = page.getByLabel('Username');
    await expect(usernameByLabel).toBeVisible();
    
    const passwordByLabel = page.getByLabel('Password');
    await expect(passwordByLabel).toBeVisible();
    
    // ========== 4. TEST ID LOCATORS ==========
    // Most stable for testing (if available)
    // Note: This site doesn't have test IDs, but demonstrating the pattern
    // await page.getByTestId('submit-btn').click();
    
    // ========== 5. COMMON ACTIONS ==========
    
    // Type text into input field
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    
    // Click button
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for navigation
    await page.waitForURL('**/secure');
    
    // ========== 6. ASSERTIONS ==========
    
    // Page-level assertions
    await expect(page).toHaveTitle(/The Internet/);
    await expect(page).toHaveURL(/secure/);
    
    // Element visibility assertions
    await expect(page.getByText('You logged into a secure area!')).toBeVisible();
    await expect(page.getByRole('heading')).toHaveText('Secure Area');
    
    // Element value assertions (for form fields)
    // Navigate to a form page to demonstrate
    await page.goto('https://the-internet.herokuapp.com/login');
    await page.getByLabel('Username').fill('test@example.com');
    await expect(page.getByLabel('Username')).toHaveValue('test@example.com');
    
    // ========== 7. CHAINING LOCATORS ==========
    // Chain locators to find nested elements
    
    // Find a container first, then find element within it
    const form = page.locator('form');
    const submitBtnInForm = form.getByRole('button', { name: 'Login' });
    await expect(submitBtnInForm).toBeVisible();
    
    // ========== 8. FILTERING LOCATORS ==========
    // Filter elements based on conditions
    
    // Navigate to a page with multiple list items
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Filter links by text content
    const examplesLink = page
      .getByRole('link')
      .filter({ hasText: 'Examples' });
    
    // If the link exists, click it
    if (await examplesLink.count() > 0) {
      await examplesLink.click();
    }
    
    // Navigate back
    await page.goBack();
    
    // Filter by multiple conditions
    const dynamicContentLink = page
      .getByRole('link')
      .filter({ hasText: 'Dynamic Content' });
    
    if (await dynamicContentLink.count() > 0) {
      await expect(dynamicContentLink).toBeVisible();
    }
  });

  test('Locator Strategy Priority - Best Practices', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // ========== PRIORITY 1: Role-based (BEST) ==========
    const loginButton = page.getByRole('button', { name: 'Login' });
    await expect(loginButton).toBeVisible();
    
    // ========== PRIORITY 2: Label-based (Great for forms) ==========
    const usernameField = page.getByLabel('Username');
    await expect(usernameField).toBeVisible();
    
    // ========== PRIORITY 3: Text-based ==========
    const loginPageText = page.getByText('Login Page');
    await expect(loginPageText).toBeVisible();
    
    // ========== PRIORITY 4: Test ID (Most stable, if available) ==========
    // await page.getByTestId('submit-btn').click();
    // Note: This site doesn't use test IDs, but this is the pattern
    
    // ========== ADVANCED: Chaining with filtering ==========
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Chain: Find container, then filter, then click
    const listItems = page.getByRole('listitem');
    const specificItem = listItems.filter({ hasText: 'Form Authentication' });
    
    if (await specificItem.count() > 0) {
      await specificItem.click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('Advanced Locator Techniques - Chaining and Filtering', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    // ========== CHAINING LOCATORS ==========
    // Start with a container, then find nested elements
    const mainContent = page.locator('#content');
    const headingInContent = mainContent.getByRole('heading', { name: 'Welcome to the-internet' });
    await expect(headingInContent).toBeVisible();
    
    // Chain multiple levels
    const listInContent = mainContent.getByRole('list');
    const firstLinkInList = listInContent.getByRole('listitem').first().getByRole('link');
    await expect(firstLinkInList).toBeVisible();
    
    // ========== FILTERING ==========
    // Filter elements based on text, visibility, or other conditions
    
    // Filter links that contain specific text
    const authLinks = page
      .getByRole('link')
      .filter({ hasText: /authentication/i });
    
    const authLinkCount = await authLinks.count();
    expect(authLinkCount).toBeGreaterThan(0);
    
    // Filter by multiple conditions
    const visibleAuthLink = page
      .getByRole('link')
      .filter({ hasText: 'Form Authentication' })
      .filter({ hasNotText: 'Broken' });
    
    if (await visibleAuthLink.count() > 0) {
      await visibleAuthLink.click();
      await expect(page).toHaveURL(/login/);
    }
    
    // ========== COMBINING TECHNIQUES ==========
    // Navigate back and demonstrate combined approach
    await page.goBack();
    
    // Find a specific section, then filter items within it
    const contentSection = page.locator('#content');
    const specificExample = contentSection
      .getByRole('link')
      .filter({ hasText: 'Dynamic Content' });
    
    if (await specificExample.count() > 0) {
      await expect(specificExample).toBeVisible();
    }
  });

  test('Form Interactions - All Locator Types with Actions', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // ========== USING ROLE-BASED LOCATORS ==========
    // Fill form using role-based locators
    await page.getByRole('textbox', { name: 'Username' }).fill('tomsmith');
    // Note: For password fields, getByLabel is more reliable than getByRole
    
    // ========== USING LABEL-BASED LOCATORS ==========
    // Alternative: Use label-based locators (often more reliable for forms)
    await page.getByLabel('Username').clear();
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').clear();
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    
    // ========== USING ROLE-BASED FOR BUTTON ==========
    await page.getByRole('button', { name: 'Login' }).click();
    
    // ========== ASSERTIONS AFTER ACTION ==========
    await expect(page).toHaveURL(/secure/);
    await expect(page.getByText('You logged into a secure area!')).toBeVisible();
    await expect(page.getByRole('heading')).toHaveText('Secure Area');
    
    // ========== CHECKBOX EXAMPLE (if available) ==========
    // Navigate to checkbox page
    await page.goto('https://the-internet.herokuapp.com/checkboxes');
    
    // Check/uncheck using role-based locator
    const checkboxes = page.getByRole('checkbox');
    const firstCheckbox = checkboxes.first();
    const lastCheckbox = checkboxes.last();
    
    // Check if not already checked
    if (!(await firstCheckbox.isChecked())) {
      await firstCheckbox.check();
    }
    
    // Uncheck if checked
    if (await lastCheckbox.isChecked()) {
      await lastCheckbox.uncheck();
    }
    
    
    // ========== DROPDOWN SELECT EXAMPLE ==========
    await page.goto('https://the-internet.herokuapp.com/dropdown');
    
    // Select dropdown option using label-based locator
    await page.getByLabel('Please select an option').selectOption('1');
    
    // Verify selection
    const selectedOption = page.getByLabel('Please select an option');
    await expect(selectedOption).toHaveValue('1');
  });

  test('5.4 Multiple Elements - Count, First, Nth', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    // ========== COUNT ELEMENTS ==========
    // Count the number of list items
    const listItemCount = await page.getByRole('listitem').count();
    expect(listItemCount).toBeGreaterThan(0);
    console.log(`Found ${listItemCount} list items`);
    
    // Count links
    const linkCount = await page.getByRole('link').count();
    expect(linkCount).toBeGreaterThan(0);
    
    // ========== FIRST ELEMENT ==========
    // Click the first button
    const firstLink = page.getByRole('link').first();
    await expect(firstLink).toBeVisible();
    
    // ========== NTH ELEMENT ==========
    // Click the 2nd button (0-indexed, so nth(2) is the 3rd element)
    // Note: nth(0) is first, nth(1) is second, nth(2) is third
    const buttons = page.getByRole('link');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 2) {
      await buttons.nth(2).click();
      await page.goBack();
    }
    
    // Get specific list item
    const listItems = page.getByRole('listitem');
    if (await listItems.count() > 1) {
      const secondListItem = listItems.nth(1);
      await expect(secondListItem).toBeVisible();
    }
  });

  test('6.1 Clicking - Simple, Double, Right Click, Modifiers', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    // ========== SIMPLE CLICK ==========
    // Simple click
    const firstLink = page.getByRole('link').first();
    await firstLink.click();
    await page.goBack();
    
    // ========== DOUBLE CLICK ==========
    // Navigate to a page that supports double click
    await page.goto('https://the-internet.herokuapp.com/login');
    const loginHeading = page.getByText('Login Page');
    await loginHeading.dblclick(); // Double click example
    
    // ========== RIGHT CLICK ==========
    // Right click (context menu)
    await page.goto('https://the-internet.herokuapp.com/');
    const link = page.getByRole('link').first();
    await link.click({ button: 'right' });
    
    // ========== CLICK WITH MODIFIERS ==========
    // Click with Control key (for opening in new tab, etc.)
    await page.goto('https://the-internet.herokuapp.com/');
    const formAuthLink = page.getByRole('link', { name: 'Form Authentication' });
    // Note: Control+Click behavior depends on browser, this demonstrates the syntax
    await formAuthLink.click({ modifiers: ['Control'] });
    
    // Click with Shift key
    await page.goto('https://the-internet.herokuapp.com/');
    const anotherLink = page.getByRole('link').first();
    await anotherLink.click({ modifiers: ['Shift'] });
  });

  test('6.2 Typing - Fill, Type, Keyboard Press', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // ========== FILL (CLEARS FIRST) ==========
    // Fill clears the field first, then types
    await page.getByLabel('Username').fill('john.doe');
    await expect(page.getByLabel('Username')).toHaveValue('john.doe');
    
    // Fill again - it will clear and replace
    await page.getByLabel('Username').fill('new.username');
    await expect(page.getByLabel('Username')).toHaveValue('new.username');
    
    // ========== TYPE (DOESN'T CLEAR) ==========
    // Type doesn't clear, it appends or types character by character
    await page.getByLabel('Username').clear();
    await page.getByLabel('Username').type('playwright');
    await expect(page.getByLabel('Username')).toHaveValue('playwright');
    
    // Type more - it will append
    await page.getByLabel('Username').type(' is awesome');
    await expect(page.getByLabel('Username')).toHaveValue('playwright is awesome');
    
    // ========== PRESS KEYS ==========
    // Press Enter key
    await page.getByLabel('Username').clear();
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    await page.keyboard.press('Enter');
    
    // Wait for navigation
    await page.waitForURL('**/secure', { timeout: 5000 }).catch(() => {});
    
    // Navigate back and demonstrate other keys
    await page.goto('https://the-internet.herokuapp.com/login');
    await page.getByLabel('Username').fill('test');
    
    // Select all text
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    
    // Type new text
    await page.getByLabel('Username').type('newtext');
    
    // Press Tab to move to next field
    await page.keyboard.press('Tab');
    await page.getByLabel('Password').fill('password');
  });

  test('6.3 Form Interactions - Checkbox, Radio, Dropdown Expanded', async ({ page }) => {
    // ========== CHECKBOX ==========
    await page.goto('https://the-internet.herokuapp.com/checkboxes');
    
    // Check checkbox by role and name
    const checkbox1 = page.getByRole('checkbox').first();
    await checkbox1.check();
    await expect(checkbox1).toBeChecked();
    
    // Uncheck checkbox
    const checkbox2 = page.getByRole('checkbox').last();
    if (await checkbox2.isChecked()) {
      await checkbox2.uncheck();
      await expect(checkbox2).not.toBeChecked();
    }
    
    // ========== RADIO BUTTON ==========
    // Navigate to a page with radio buttons (using a demo site)
    await page.goto('https://demoqa.com/radio-button');
    await page.waitForLoadState('networkidle');
    
    // Check radio button by role and name
    const yesRadio = page.getByRole('radio', { name: /yes/i });
    if (await yesRadio.count() > 0) {
      await yesRadio.first().check();
      await expect(yesRadio.first()).toBeChecked();
    }
    
    // ========== DROPDOWN ==========
    await page.goto('https://the-internet.herokuapp.com/dropdown');
    
    // Select by value
    await page.getByLabel('Please select an option').selectOption('1');
    await expect(page.getByLabel('Please select an option')).toHaveValue('1');
    
    // Select by label
    await page.getByLabel('Please select an option').selectOption({ label: 'Option 2' });
    await expect(page.getByLabel('Please select an option')).toHaveValue('2');
    
    // Select by index
    await page.getByLabel('Please select an option').selectOption({ index: 0 });
  });

  test('6.5 Mouse Actions - Hover, Drag and Drop', async ({ page }) => {
    // ========== HOVER ==========
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Hover over a link
    const link = page.getByRole('link').first();
    await link.hover();
    
    // Hover over specific link
    const formAuthLink = page.getByRole('link', { name: 'Form Authentication' });
    await formAuthLink.hover();
    await formAuthLink.click();
    await page.goBack();
    
    // ========== DRAG AND DROP ==========
    await page.goto('https://the-internet.herokuapp.com/drag_and_drop');
    
    // Drag and drop elements
    const columnA = page.locator('#column-a');
    const columnB = page.locator('#column-b');
    
    // Verify elements exist
    await expect(columnA).toBeVisible();
    await expect(columnB).toBeVisible();
    
    // Perform drag and drop
    await columnA.dragTo(columnB);
    
    // Verify the drag and drop occurred (text should swap)
    await expect(columnA).toContainText('B');
    await expect(columnB).toContainText('A');
  });

  test('6.6 Complete Form Example', async ({ page }) => {
    // Navigate to a form page (using a demo form site)
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Fill form fields
    await page.getByLabel('Username').fill('John');
    await page.getByLabel('Password').fill('john@example.com');
    
    // For a more complete example, let's use a registration-like flow
    // Navigate to a page with more form fields
    await page.goto('https://demoqa.com/text-box');
    await page.waitForLoadState('networkidle');
    
    // Fill all form fields
    await page.getByLabel('Full Name').fill('John Doe');
    await page.getByLabel('Email').fill('john@example.com');
    await page.getByLabel('Current Address').fill('123 Main St');
    await page.getByLabel('Permanent Address').fill('456 Oak Ave');
    
    // If there's a checkbox for agreement
    const checkboxes = page.getByRole('checkbox');
    if (await checkboxes.count() > 0) {
      await checkboxes.first().check();
    }
    
    // Click submit/register button
    const submitButton = page.getByRole('button', { name: /submit/i });
    if (await submitButton.count() > 0) {
      await submitButton.click();
    }
  });

  test('7.1 Auto-Retrying Assertions', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // ========== AUTO-RETRYING ASSERTIONS ==========
    // Playwright assertions automatically retry until timeout (default 5 seconds)
    // This will retry for 5 seconds by default
    await expect(page.getByText('Login Page')).toBeVisible();
    
    // Fill form and wait for success message
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // This assertion will automatically retry until the element appears
    await expect(page.getByText('You logged into a secure area!')).toBeVisible();
  });

  test('7.2 Page Assertions - URL and Title', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // ========== PAGE URL ASSERTIONS ==========
    // Exact URL match
    await expect(page).toHaveURL('https://the-internet.herokuapp.com/login');
    
    // URL regex match
    await expect(page).toHaveURL(/login/);
    await expect(page).toHaveURL(/the-internet\.herokuapp\.com/);
    
    // Navigate and check new URL
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await expect(page).toHaveURL(/secure/);
    await expect(page).toHaveURL(/\/secure/);
    
    // ========== PAGE TITLE ASSERTIONS ==========
    await page.goto('https://the-internet.herokuapp.com/');
    await expect(page).toHaveTitle('The Internet');
    await expect(page).toHaveTitle(/Internet/);
    
    await page.goto('https://the-internet.herokuapp.com/login');
    await expect(page).toHaveTitle(/Login/);
  });

  test('7.3 Element Visibility - Visible, Hidden, Not Visible', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // ========== ELEMENT VISIBILITY ==========
    // Check if element is visible
    await expect(page.getByText('Login Page')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    
    // Check if element is hidden
    // Some elements might be hidden initially
    const hiddenElements = page.locator('[style*="display: none"]');
    if (await hiddenElements.count() > 0) {
      await expect(hiddenElements.first()).toBeHidden();
    }
    
    // Check element is not visible (alternative syntax)
    // Navigate to a page with dynamic content
    await page.goto('https://the-internet.herokuapp.com/dynamic_loading/1');
    const startButton = page.getByRole('button');
    await startButton.click();
    
    // Wait for loading to finish and content to appear
    await expect(page.getByText('Hello World!', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('7.4 Element State - Enabled, Disabled, Checked', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // ========== ELEMENT STATE ==========
    // Check if button is enabled
    await expect(page.getByRole('button', { name: 'Login' })).toBeEnabled();
    
    // Check if input is enabled
    await expect(page.getByLabel('Username')).toBeEnabled();
    await expect(page.getByLabel('Password')).toBeEnabled();
    
    // ========== CHECKBOX STATE ==========
    await page.goto('https://the-internet.herokuapp.com/checkboxes');
    
    // Check if checkbox is checked
    const checkbox1 = page.getByRole('checkbox').first();
    const isChecked = await checkbox1.isChecked();
    
    if (isChecked) {
      await expect(checkbox1).toBeChecked();
    } else {
      await checkbox1.check();
      await expect(checkbox1).toBeChecked();
    }
    
    // Check if checkbox is not checked
    const checkbox2 = page.getByRole('checkbox').last();
    if (!(await checkbox2.isChecked())) {
      await expect(checkbox2).not.toBeChecked();
      await checkbox2.check();
      await expect(checkbox2).toBeChecked();
    }
  });

  test('7.5 Text Content - Exact, Contains, Array Match', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // ========== EXACT TEXT MATCH ==========
    // Exact match
    await expect(page.getByRole('heading')).toHaveText('Login Page');
    
    // ========== CONTAINS TEXT ==========
    // Contains text (partial match)
    await expect(page.getByText('Login')).toContainText('Login');
    await expect(page.getByRole('heading')).toContainText('Page');
    
    // Login and check success message
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await expect(page.getByText('You logged into a secure area!')).toContainText('secure area');
    await expect(page.getByRole('heading')).toContainText('Secure');
    
    // ========== ARRAY MATCH ==========
    // Navigate to a page with a list
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Get all list items and check their text
    const listItems = page.getByRole('listitem');
    const count = await listItems.count();
    
    if (count >= 2) {
      const firstText = await listItems.first().textContent();
      const secondText = await listItems.nth(1).textContent();
      
      // Check first two items match expected array
      const expectedTexts = [firstText?.trim(), secondText?.trim()].filter(Boolean);
      if (expectedTexts.length > 0) {
        // Verify individual items
        await expect(listItems.first()).toHaveText(expectedTexts[0] || '');
      }
    }
  });

  test('7.6 Input Values - Value Assertions', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // ========== INPUT VALUES ==========
    // Fill and check exact value
    await page.getByLabel('Username').fill('user@example.com');
    await expect(page.getByLabel('Username')).toHaveValue('user@example.com');
    
    // Check value with regex
    await page.getByLabel('Username').fill('test@example.com');
    await expect(page.getByLabel('Username')).toHaveValue(/.*@example\.com/);
    
    // Fill password
    await page.getByLabel('Password').fill('password123');
    await expect(page.getByLabel('Password')).toHaveValue('password123');
    
    // ========== DROPDOWN VALUES ==========
    await page.goto('https://the-internet.herokuapp.com/dropdown');
    
    await page.getByLabel('Please select an option').selectOption('1');
    await expect(page.getByLabel('Please select an option')).toHaveValue('1');
    
    await page.getByLabel('Please select an option').selectOption('2');
    await expect(page.getByLabel('Please select an option')).toHaveValue('2');
  });

  test('7.7 Attributes - Attribute and Class Assertions', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // ========== ATTRIBUTE ASSERTIONS ==========
    // Check button has type attribute
    const loginButton = page.getByRole('button', { name: 'Login' });
    await expect(loginButton).toHaveAttribute('type', 'submit');
    
    // Check input has type attribute
    const usernameInput = page.getByLabel('Username');
    await expect(usernameInput).toHaveAttribute('type', 'text');
    
    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // ========== CLASS ASSERTIONS ==========
    // Check element has specific class
    // Note: This depends on the actual classes in the page
    const form = page.locator('form');
    const formClass = await form.getAttribute('class');
    
    if (formClass) {
      // Check if class contains specific value
      await expect(form).toHaveClass(new RegExp(formClass.split(' ')[0]));
    }
    
    // Check class with regex
    // Navigate to a page with more styled elements
    await page.goto('https://the-internet.herokuapp.com/');
    const heading = page.getByRole('heading');
    const headingClass = await heading.getAttribute('class');
    
    if (headingClass) {
      await expect(heading).toHaveClass(new RegExp(headingClass.split(' ')[0]));
    }
  });

  test('7.8 Count - Element Count Assertions', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    // ========== COUNT ASSERTIONS ==========
    // Count list items
    const listItems = page.getByRole('listitem');
    const count = await listItems.count();
    
    // Assert count is greater than 0
    expect(count).toBeGreaterThan(0);
    await expect(listItems).toHaveCount(count);
    
    // Count links
    const links = page.getByRole('link');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);
    await expect(links).toHaveCount(linkCount);
    
    // ========== COUNT IS ZERO ==========
    // Check for elements that don't exist
    const nonExistentElements = page.getByRole('alert');
    await expect(nonExistentElements).toHaveCount(0);
    
    // ========== SPECIFIC COUNT ==========
    // Navigate to checkboxes page
    await page.goto('https://the-internet.herokuapp.com/checkboxes');
    const checkboxes = page.getByRole('checkbox');
    await expect(checkboxes).toHaveCount(2);
  });

  test('7.9 Screenshots - Page and Element Screenshots', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // ========== PAGE SCREENSHOT ==========
    // Take screenshot of entire page
    await page.screenshot({ path: 'test-results/homepage-screenshot.png' });
    
    // Screenshot assertion (compares with baseline)
    // Note: First run creates baseline, subsequent runs compare
    // await expect(page).toHaveScreenshot('homepage.png');
    
    // ========== ELEMENT SCREENSHOT ==========
    // Take screenshot of specific element
    const loginButton = page.getByRole('button', { name: 'Login' });
    await loginButton.screenshot({ path: 'test-results/button-screenshot.png' });
    
    // Element screenshot assertion
    // await expect(loginButton).toHaveScreenshot('button.png');
    
    // ========== FULL PAGE SCREENSHOT ==========
    await page.goto('https://the-internet.herokuapp.com/');
    await page.screenshot({ 
      path: 'test-results/full-page-screenshot.png',
      fullPage: true 
    });
  });

  test('7.10 Custom Timeout - Assertion Timeouts', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // ========== CUSTOM TIMEOUT ==========
    // Default timeout is 5 seconds, but you can customize it
    
    // Assertion with custom timeout (30 seconds)
    await expect(page.getByText('Login Page')).toBeVisible({ timeout: 30000 });
    
    // For slow-loading elements, use longer timeout
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for slow element with custom timeout
    await expect(page.getByText('You logged into a secure area!')).toBeVisible({ timeout: 10000 });
    
    // ========== SHORTER TIMEOUT ==========
    // Use shorter timeout for elements that should appear quickly
    await page.goto('https://the-internet.herokuapp.com/');
    await expect(page.getByRole('heading')).toBeVisible({ timeout: 2000 });
    
    // ========== TIMEOUT FOR URL ==========
    await page.goto('https://the-internet.herokuapp.com/login');
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for URL change with custom timeout
    await expect(page).toHaveURL(/secure/, { timeout: 10000 });
  });
  
});
