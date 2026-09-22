const { test, expect } = require('@playwright/test');

// DIP: High-level modules should not depend on low-level modules. Both should depend on abstractions.
/*
Dependency Inversion Principle ( DIP-Playwright.js ) : 
The high-level module CheckoutTest depends on the abstraction NotificationService, and the low-level modules 
ConsoleNotificationService and ApiNotificationService depend on it. This ensures that changes in the low-level 
modules (e.g., notification methods) do not affect the high-level module.
*/

// Abstraction for a notification service
class NotificationService {
  async send(message) {
    throw new Error('Notification service not implemented');
  }
}

// Low-level module: Console notification service
class ConsoleNotificationService extends NotificationService {
  async send(message) {
    console.log(`NOTIFICATION: ${message}`);
  }
}

// Low-level module: API-based notification service (e.g., Slack, Email)
class ApiNotificationService extends NotificationService {
    constructor(request) {
        super();
        this.request = request;
    }
  async send(message) {
    await this.request.post('/api/notify', { data: { message } });
    console.log('API notification sent.');
  }
}

// High-level module: A test that performs an action and sends a notification
class CheckoutTest {
  constructor(notificationService) {
    this.notificationService = notificationService;
  }

  async run(page) {
    await page.goto('/checkout');
    await page.click('#confirm-purchase');
    // On successful purchase
    await this.notificationService.send('Purchase completed successfully!');
  }
}

// Tests demonstrating DIP
test.describe('Checkout Notifications (DIP)', () => {
  test('should send notification to console after checkout', async ({ page }) => {
    // Injecting the console notification service
    const consoleNotifier = new ConsoleNotificationService();
    const checkoutTest = new CheckoutTest(consoleNotifier);

    await checkoutTest.run(page);

    // In a real test, you might spy on console.log to verify the message
    await expect(page.locator('.thank-you-message')).toBeVisible();
    console.log('DIP test with ConsoleNotifier passed.');
  });

  test('should send notification via API after checkout', async ({ page, request }) => {
    // Injecting the API notification service
    const apiNotifier = new ApiNotificationService(request);
    const checkoutTest = new CheckoutTest(apiNotifier);

    // Mock the API endpoint
    await page.route('/api/notify', route => {
        expect(route.request().postDataJSON()).toEqual({ message: 'Purchase completed successfully!' });
        route.fulfill({ status: 200, body: 'OK' });
    });

    await checkoutTest.run(page);

    await expect(page.locator('.thank-you-message')).toBeVisible();
    console.log('DIP test with ApiNotifier passed.');
  });
});
  