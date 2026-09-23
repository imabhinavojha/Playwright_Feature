import { test, expect, request } from '@playwright/test';


test('Check broken links', async ({ page, request }) => {
  await page.goto('https://google.com');

  const links = await page.$$eval('a', anchors =>
    anchors
      .map(a => a.href)
      .filter(href => href && href.startsWith('http'))
  );

  console.log(`Total links found: ${links.length}`);

  for (const link of links) {
    const response = await request.get(link);

    if (response.status() >= 400) {
      console.log(`❌ Broken link: ${link} -> ${response.status()}`);
    } else {
      console.log(`✅ Valid link: ${link}`);
    }
  }
});


test('Broken link validation', async ({ page, request }) => {
  await page.goto('https://google.com');

  const links = await page.locator('a').evaluateAll(elements =>
    elements
      .map(el => el.href)
      .filter(href => href && href.startsWith('http'))
  );

  console.log(`Total links found: ${links.length}`);

  for (const url of links) {
    try {
      const response = await request.fetch(url);
      const status = response.status();

      if (status >= 400) {
        console.error(`❌ Broken: ${url} | Status: ${status}`);
      }else{
        console.log(`✅ Valid link: ${url}`);
      }
    } catch (error) {
      console.error(`❌ Failed request: ${url}`);
    }
  }
});


