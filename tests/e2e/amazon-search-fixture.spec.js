const { test, expect } = require('../../fixtures/amazon.fixture');

test.describe('Amazon search using Playwright fixtures', () => {
  test('go to amazon.in and search', async ({ amazon }) => {
    const query = 'playwright book';

    await amazon.goto();
    await amazon.search(query);

    await expect(amazon.page).toHaveURL(/amazon\.in\/s\?/);
    await expect(amazon.resultsQueryText).toContainText('playwright');
  });
});

