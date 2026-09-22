const { test, expect, chromium } = require('@playwright/test');

test.describe('11.1 Visual Regression Testing', () => {
  
  test('Basic Screenshot Comparison - Homepage', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    // First run creates baseline, subsequent runs compare against it
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('Element Screenshot - Header', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    const header = page.locator('header').or(page.locator('h1, h2').first());
    
    // Screenshot of specific element
    await expect(header).toHaveScreenshot('header.png');
  });

  test('Full Page Screenshot', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Full page screenshot (captures entire page, not just viewport)
    await expect(page).toHaveScreenshot('login-page-full.png', {
      fullPage: true
    });
  });

  test('Advanced Configuration - Dashboard with Masking', async () => {
    const browser = await chromium.launch({ headless: false }); // headless mode
      const page = await browser.newPage();
    await page.goto('https://the-internet.herokuapp.com/secure');
    
    // First lgin to access secure page
    await page.goto('https://the-internet.herokuapp.com/login');
    await page.getByRole('textbox', { name: 'Username' }).fill('tomsmith');
    await page.getByRole('textbox', { name: 'Password' }).fill('SuperSecretPassword!');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await page.goto('https://the-internet.herokuapp.com/secure');
    
    // Advanced screenshot with masking and thresholds
    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixels: 100, // Allow 100 pixels difference
      threshold: 0.2, // 20% difference threshold
      mask: [ // Hide dynamic content
        page.locator('.flash'), // Flash messages that change
        page.locator('time'), // Timestamps
      ],
      animations: 'disabled' // Disable animations
    });
  });

  test('Screenshot with Custom Threshold', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    await expect(page).toHaveScreenshot('homepage-custom-threshold.png', {
      threshold: 0.3, // 30% difference allowed
      maxDiffPixels: 500 // Allow up to 500 pixels difference
    });
  });

  test('Screenshot with Specific Region', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    const contentArea = page.locator('#content');
    
    // Screenshot of specific region
    await expect(contentArea).toHaveScreenshot('content-area.png', {
      maxDiffPixels: 50
    });
  });

  test('Responsive Visual Testing - Multiple Viewports', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('https://the-internet.herokuapp.com/');
      
      // Wait for page to stabilize
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`);
    }
  });

  test('Screenshot with Animation Disabled', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    await expect(page).toHaveScreenshot('homepage-no-animations.png', {
      animations: 'disabled' // Disable CSS animations and transitions
    });
  });

  test('Screenshot with Caret Hidden', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Focus on input to show caret
    await page.getByLabel('Username').focus();
    
    await expect(page).toHaveScreenshot('login-with-caret-hidden.png', {
      caret: 'hide' // Hide text caret
    });
  });

  test('Screenshot with Custom Styles Applied', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Apply custom styles before screenshot
    await page.addStyleTag({ content: 'body { background-color: white !important; }' });
    
    await expect(page).toHaveScreenshot('homepage-styled.png');
  });

  test('Multiple Element Screenshots', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Screenshot of heading
    const heading = page.getByRole('heading');
    await expect(heading).toHaveScreenshot('heading.png');
    
    // Screenshot of navigation
    const nav = page.locator('ul').first();
    if (await nav.count() > 0) {
      await expect(nav).toHaveScreenshot('navigation.png');
    }
  });

  test('Screenshot Before and After Action', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Screenshot before filling form
    await expect(page).toHaveScreenshot('login-before.png');
    
    // Fill form
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    
    // Screenshot after filling form
    await expect(page).toHaveScreenshot('login-after-fill.png');
    
    // Click login
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Screenshot after login
    await expect(page).toHaveScreenshot('login-after-submit.png');
  });

  test('Screenshot with Wait for Stability', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Wait for specific element to be visible
    await page.waitForSelector('h1, h2');
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage-stable.png');
  });
});

test.describe('11.2 Accessibility Testing with axe-core', () => {
  
  test('Basic Accessibility Test - Install axe-core first', async ({ page }) => {
    // Note: Install axe-core first: npm install -D @axe-core/playwright
    // Then uncomment the code below
    
    /*
    const { injectAxe, checkA11y } = require('@axe-core/playwright');
    
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Inject axe-core into the page
    await injectAxe(page);
    
    // Run accessibility checks
    await checkA11y(page);
    */
    
    // For now, demonstrate the pattern without the library
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Basic accessibility checks using Playwright
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Images should have alt text (or be decorative with empty alt)
      expect(alt).not.toBeNull();
    }
    
    // Check for heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0); // Should have at least one heading
    
    // Check for form labels
    await page.goto('https://the-internet.herokuapp.com/login');
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      // Input should have label, aria-label, or aria-labelledby
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('Accessibility - Keyboard Navigation', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    const isFocused = await focusedElement.count() > 0;
    expect(isFocused).toBeTruthy();
    
    // Check if focused element has visible focus indicator
    const focusStyles = await focusedElement.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth
      };
    });
    
    // Should have some form of focus indicator
    expect(focusStyles.outlineWidth !== '0px' || focusStyles.outline !== 'none').toBeTruthy();
  });

  test('Accessibility - ARIA Attributes', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Check for proper ARIA roles
    const buttons = page.getByRole('button');
    const links = page.getByRole('link');
    
    // Buttons and links should be accessible
    expect(await buttons.count()).toBeGreaterThanOrEqual(0);
    expect(await links.count()).toBeGreaterThan(0);
    
    // Check for aria-labels on interactive elements
    const interactiveElements = page.locator('button, a, input, select, textarea');
    const count = await interactiveElements.count();
    
    // At least some elements should be accessible
    expect(count).toBeGreaterThan(0);
  });

  test('Accessibility - Color Contrast (Basic Check)', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Basic color contrast check
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6');
    const firstText = textElements.first();
    
    if (await firstText.count() > 0) {
      const styles = await firstText.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Elements should have color defined
      expect(styles.color).toBeTruthy();
    }
  });

  test('Accessibility - Form Validation Messages', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Check for error messages (should be accessible)
    const errorMessages = page.locator('[role="alert"], .error, .alert');
    const errorCount = await errorMessages.count();
    
    // If errors exist, they should be accessible
    if (errorCount > 0) {
      const firstError = errorMessages.first();
      const isVisible = await firstError.isVisible();
      expect(isVisible).toBeTruthy();
      
      // Error should have accessible text
      const errorText = await firstError.textContent();
      expect(errorText).toBeTruthy();
    }
  });

  test('Accessibility - Skip Links', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Check for skip links (common accessibility feature)
    const skipLinks = page.locator('a[href*="#main"], a[href*="#content"], .skip-link');
    const skipLinkCount = await skipLinks.count();
    
    // Skip links are optional but good practice
    console.log(`Skip links found: ${skipLinkCount}`);
  });

  test('Accessibility - Semantic HTML', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Check for semantic HTML elements
    const main = page.locator('main');
    const nav = page.locator('nav');
    const article = page.locator('article');
    const section = page.locator('section');
    const header = page.locator('header');
    const footer = page.locator('footer');
    
    // Log semantic elements found
    console.log('Semantic elements:', {
      main: await main.count(),
      nav: await nav.count(),
      article: await article.count(),
      section: await section.count(),
      header: await header.count(),
      footer: await footer.count()
    });
  });

  test('Accessibility - Screen Reader Compatibility', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Check for screen reader friendly attributes
    const form = page.locator('form');
    
    if (await form.count() > 0) {
      // Forms should have accessible labels
      const inputs = form.locator('input');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const type = await input.getAttribute('type');
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        
        // Inputs should have some form of label
        if (type !== 'hidden') {
          expect(id || ariaLabel).toBeTruthy();
        }
      }
    }
  });

  test('Accessibility - Focus Management', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Test focus management
    await page.getByLabel('Username').focus();
    const usernameFocused = await page.getByLabel('Username').evaluate(el => document.activeElement === el);
    expect(usernameFocused).toBeTruthy();
    
    // Tab to next element
    await page.keyboard.press('Tab');
    const passwordFocused = await page.getByLabel('Password').evaluate(el => document.activeElement === el);
    expect(passwordFocused).toBeTruthy();
  });
});

test.describe('Visual Regression - Best Practices', () => {
  
  test('Screenshot with Retry Logic', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Screenshot with retry on failure
    await expect(page).toHaveScreenshot('homepage-retry.png', {
      timeout: 10000, // 10 second timeout
      maxDiffPixels: 100
    });
  });

  test('Screenshot Comparison - Before Update', async ({ page }) => {
    // This test demonstrates taking a baseline screenshot
    await page.goto('https://the-internet.herokuapp.com/');
    
    // First run: Creates baseline
    // Subsequent runs: Compares against baseline
    await expect(page).toHaveScreenshot('baseline-homepage.png');
  });

  test('Screenshot - Multiple Browsers', async ({ page, browserName }) => {
    // This test will run on all configured browsers
    await page.goto('https://the-internet.herokuapp.com/');
    
    // Screenshots are browser-specific by default
    await expect(page).toHaveScreenshot(`homepage-${browserName}.png`);
  });
});

