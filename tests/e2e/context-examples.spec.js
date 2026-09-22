const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const EXAMPLE_URL = 'https://example.com';

// Context-centric examples demonstrating configuration, events, storage, and assertions.
test.describe('Browser Context Examples', () => {
  
  test('Isolated context per user session', async ({ browser }) => {
    const userContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Playwright User)',
      locale: 'en-GB',
      timezoneId: 'Europe/London',
      httpCredentials: { username: 'admin', password: 'pass' }
    });

    userContext.setDefaultTimeout(5000);
    userContext.setDefaultNavigationTimeout(10000);

    const page = await userContext.newPage();
    await page.goto(EXAMPLE_URL);

    expect(await page.viewportSize()).toEqual({ width: 1280, height: 720 });
    await userContext.close();
  });

  test('Context permissions and geolocation', async ({ browser }) => {
    const context = await browser.newContext({
      geolocation: { latitude: 37.7749, longitude: -122.4194 },
      permissions: ['geolocation', 'notifications']
    });

    await context.grantPermissions(['clipboard-read'], { origin: EXAMPLE_URL });
    await context.clearPermissions();

    const page = await context.newPage();
    await page.goto('https://maps.google.com');

    // Double-check context-level geolocation
    const position = await page.evaluate(() => new Promise(resolve => navigator.geolocation.getCurrentPosition(resolve)));
    expect(position.coords.latitude).toBeCloseTo(37.7749, 4);
    expect(position.coords.longitude).toBeCloseTo(-122.4194, 4);

    await context.close();
  });

  test('Context cookies and storage state', async ({ browser }) => {
    const context = await browser.newContext();
    await context.addCookies([
      { name: 'auth', value: 'token123', domain: 'example.com', path: '/', httpOnly: true },
      { name: 'theme', value: 'dark', url: 'https://example.com' }
    ]);

    const cookies = await context.cookies(EXAMPLE_URL);
    expect(cookies.find(cookie => cookie.name === 'auth')).toBeTruthy();

    // Persist storage for reuse
    const statePath = 'tests/.authState.json';
    await context.storageState({ path: statePath });
    await context.close();

    const reused = await browser.newContext({ storageState: statePath });
    const reusedCookies = await reused.cookies(EXAMPLE_URL);
    expect(reusedCookies.some(cookie => cookie.name === 'theme')).toBeTruthy();
    await reused.close();
  });

  test('Multi-page handling inside one context', async ({ browser }) => {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    await pageA.goto('https://playwright.dev');
    await pageB.goto('https://example.com');

    await expect(pageA).toHaveTitle(/Playwright/);
    await expect(pageB).toHaveTitle(/Example Domain/);

    const pages = context.pages();
    expect(pages.length).toBe(2);

    await context.close();
  });

  test('Context events: page, request, console, web error', async ({ browser }) => {
    const context = await browser.newContext();

    const events = { page: false, request: false, console: false, weberror: false };

    context.on('page', page => {
      events.page = true;
      page.on('console', msg => {
        events.console = true;
      });
    });

    context.on('request', request => {
      if (request.url().includes('example')) {
        events.request = true;
      }
    });

    context.on('weberror', error => {
      console.log('WEB ERROR', error.error());
      events.weberror = true;
    });

    const page = await context.newPage();
    await page.goto(EXAMPLE_URL);
    await page.evaluate(() => console.log('hello from page'));

    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error('Context-level error');
      }, 0);
    });

    await page.waitForTimeout(500);

    expect(events.page).toBeTruthy();
    expect(events.request).toBeTruthy();
    expect(events.console).toBeTruthy();
    expect(events.weberror).toBeTruthy();

    await context.close();
  });

  test('Context-level route mocking and request assertions', async ({ browser }) => {
    const context = await browser.newContext();

    await context.route('**/api/orders', async route => {
      const req = route.request();
      expect(req.method()).toBe('POST');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    const page = await context.newPage();
    const response = await page.request.post('https://example.com/api/orders', {
      data: { id: 'order-1' }
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ success: true });

    await context.close();
  });

  // test('Context download and file handling', async ({ browser, tmpPath }) => {
  //   const context = await browser.newContext({ acceptDownloads: true });
  //   const page = await context.newPage();

  //   await page.setContent(`
  //     <a id="download" href="data:text/plain,Playwright">Download</a>
  //     <script>document.getElementById('download').click();</script>
  //   `);

  //   const download = await page.waitForEvent('download');
  //   const downloadPath = `${tmpPath}/playwright.txt`;
  //   await download.saveAs(downloadPath);

  //   const fileContents = await download.createReadStream();
  //   expect(fileContents).toBeTruthy();

  //   await context.close();
  // });

  test('Context tracing and video setup', async ({ browser }) => {
    const context = await browser.newContext({
      recordVideo: { dir: 'test-results/videos' }
    });

    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    await page.goto('https://playwright.dev');
    await page.click('text=Get started');

    await context.tracing.stop({ path: 'test-results/context-trace.zip' });
    await context.close();
  });

  test('Context emulate network conditions', async ({ browser }) => {
    const context = await browser.newContext({
      offline: false
    });

    await context.route('**/*', async route => {
      await route.continue();
    });

    const page = await context.newPage();
    await context.setOffline(true);

    const error = await page.goto(EXAMPLE_URL).catch(err => err);
    expect(error).toBeTruthy();

    await context.setOffline(false);
    await page.goto(EXAMPLE_URL);
    await expect(page).toHaveTitle(/Example Domain/);

    await context.close();
  });

  test('Context-level storage cleanup', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(EXAMPLE_URL);
    await page.evaluate(() => {
      localStorage.setItem('key', 'value');
      sessionStorage.setItem('sessionKey', 'sessionValue');
    });

    await context.clearCookies();
    const statePath = path.join(__dirname, '.tempState.json');
    await context.storageState({
      path: statePath
    });

    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    expect(Array.isArray(state.cookies)).toBeTruthy();

    await context.close();
  });
});
