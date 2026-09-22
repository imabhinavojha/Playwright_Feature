const { test, expect,chromium } = require('@playwright/test');


// 1. API testing with request context
test('API GET request', async ({ request }) => {
  const response = await request.get('https://jsonplaceholder.typicode.com/posts/1');
  expect(response.status()).toBe(200);
  const data = await response.json();
  console.log(data)
  expect(data.id).toBe(1);
});

// 2. UI: Basic navigation and assertions
test('Homepage loads with correct title', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});

// 3. File upload functionality
test('File upload example', async ({ page }) => {
  await page.goto('https://the-internet.herokuapp.com/upload');
  const filePath = './package.json'; // Use a local file in your project
  await page.locator('#file-upload').setInputFiles(filePath);
  await page.click('#file-submit');
  await expect(page.locator('h3')).toHaveText('File Uploaded!');
});

// 5. Frame (iframe) interaction
test('Iframe interaction and dropdown select example', async ({ page }) => {
  // Go to W3Schools iframe demo page
  await page.goto('https://www.w3schools.com/tags/tryit.asp?filename=tryhtml_select');

  await page.waitForLoadState('networkidle')

  // Switch to iframe by name 'iframeResult'
  const frame = page.frame({ name: 'iframeResult' });

  // Interact inside the iframe
  // Select dropdown option by value "audi"
  await frame.selectOption('select', 'audi');

  // Verify the selected option (get selected value)
  const selectedValue = await frame.evaluate(() => {
    const selectElement = document.querySelector('select');
    return selectElement.value;
  });

  expect(selectedValue).toBe('audi');
});

// 6. Dialog (alert, confirm, prompt)
test('Handling dialog', async () => {
  const browser = await chromium.launch({ headless: false }); // headless mode
  const page = await browser.newPage();

  await page.goto('https://the-internet.herokuapp.com/javascript_alerts');
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000);
  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('alert');
    await dialog.accept();
  });
  await page.click('button[onclick="jsAlert()"]');
});

// 7. New window/tab handling
test('Handling new tabs/windows', async ({ page }) => {
  await page.goto('https://the-internet.herokuapp.com/windows');
  const [newPage] = await Promise.all([
    page.waitForEvent('popup'),
    page.click('a[href="/windows/new"]'),
  ]);
  await newPage.waitForLoadState();
  expect(await newPage.title()).toContain('New Window');
  await newPage.close();
});

test('New tab using context.pages()', async ({ page }) => {
  await page.goto('https://the-internet.herokuapp.com/windows');

  const [newPage] = await Promise.all([
    page.waitForEvent('popup'),
    page.click('a[href="/windows/new"]'),
  ]);

  await newPage.waitForLoadState();
  expect(await newPage.title()).toContain('New Window');
});

// 8. Browser navigation: back, forward, reload
test('Navigation operations', async ({ page }) => {
  await page.goto('https://example.com/');
  await page.goto('https://playwright.dev/');
  await page.goBack(); // Back to example.com
  await page.goForward(); // Forward to playwright.dev
  await page.reload();
  expect(await page.title()).toContain('Playwright');
});

// 9. Screenshot for evidence
test('Take a screenshot', async ({ page }) => {
  await page.goto('https://example.com/');
  await page.screenshot({ path: 'example-screenshot.png' });
  // Manual check: screenshot file should exist
});

// 10. Context and Browser
test('Browser Context', async ({ browser }) => {
  //2. Permissions (geolocation, clipboard, notifications, etc.)
  const context = await browser.newContext({
    geolocation: { latitude: 28.6139, longitude: 77.2090 },
    permissions: ['geolocation'],
  }); 

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'https://example.com',
  });
  await context.clearPermissions();

  
  context.setDefaultTimeout(10000);               // for all waits in this context
  context.setDefaultNavigationTimeout(20000);     // for all navigations

  
  await context.addCookies([
    { name: 'auth', value: 'token123', url: 'https://example.com' },
  ]);
  const page1 = await context.newPage();

  await page1.goto('https://example.com/');
  await page1.screenshot({ path: 'example-screenshot.png' });
  // Manual check: screenshot file should exist
});

//11. 
test('context events', async ({ browser }) => {
  const context = await browser.newContext();

  context.on('page', page => {
    console.log('New page:', page.url());
  });

  context.on('request', request => {
    console.log('REQ:', request.method(), request.url());
  });

  context.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text());
  });

  context.on('weberror', error => {
    console.log('WEB ERROR:', error.error());
  });

  const page = await context.newPage();
  await page.goto('https://example.com');
});

test('Mobile Hindi user', async ({ browser }) => {

  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent: 'MyCustomUA',
    locale: 'hi-IN',
    timezoneId: 'Asia/Kolkata',
  });

  const page = await context.newPage();
  await page.goto('https://example.com');
});

