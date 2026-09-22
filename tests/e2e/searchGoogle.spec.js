const { test, expect, chromium } = require('@playwright/test');

test.skip('Brave 1', async ({ page }) => {
  await page.goto('https://www.amazon.in');

  await page.getByPlaceholder('Search Amazon.in').fill('mobile');
  await page.keyboard.press('Enter');
  await page.screenshot({ path: 'getByPlaceholder.png' });
});

test.skip('Brave 2', async () => {
  const browser = await chromium.launch({ headless: false }); // headless mode
  const page = await browser.newPage();
  await page.goto('https://www.amazon.in');

  await page.getByRole('searchbox', { name: 'Search Amazon.in' }).click();
  await page.getByRole('searchbox', { name: 'Search Amazon.in' }).fill('laptop');
  await page.keyboard.press('Enter');
  await page.screenshot({ path: 'getByRole.png' });

  await page.locator('#twotabsearchtextbox').click();
  await page.locator('#twotabsearchtextbox').clear();
  await page.locator('#twotabsearchtextbox').fill('glasses');
  await page.keyboard.press('Enter');
  await page.screenshot({ path: 'locator.png' });

});

test('Handle list of elements', async () => {
  const browser = await chromium.launch({ headless: false }); // headless mode
  const page = await browser.newPage();
  
  await page.goto('https://www.amazon.in');
  await page.getByPlaceholder('Search Amazon.in').fill('mobile');
  await page.keyboard.press('Enter');

  // Locator for all product titles
  await page.waitForSelector("div[role='listitem']");
  const products = page.locator(`//div[@role='listitem']`);
  const count = await products.count();
  console.log('Total products:', count);

  for (let i = 0; i < count; i++) {
    const rawText = await products.nth(i).textContent();
    if (!rawText) {
      continue;
    }

    const cleanedText = rawText
      .replace(
        'SponsoredSponsored You are seeing this ad based on the product’s relevance to your search query.',
        ''
      )
      .trim();

    const shortText = cleanedText.slice(0, 70);
    console.log(shortText);
    console.log('\n');
  }

  // let va =  await products.allTextContents();
  // console.log("Val "+va);
});