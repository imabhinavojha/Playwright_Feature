import { test, expect, type Locator, type Page } from '@playwright/test';
import { PDFParse } from 'pdf-parse';


async function getPdfTextFromPopup(page: Page, pdfExportHandle: Locator): Promise<string> {
  const [popup] = await Promise.all([
    page.context().waitForEvent('page'),
    pdfExportHandle.click(),
  ]);

  await popup.waitForLoadState('load');

  const base64 = await popup.evaluate(async () => {
    const resp = await fetch(location.href);
    const ab = await resp.arrayBuffer();
    const bytes = new Uint8Array(ab);
    let binary = '';
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
  });

  const pdfBuffer = Buffer.from(base64, 'base64');

  const parser = new PDFParse({ data: pdfBuffer });
  const result = await parser.getText();
  await parser.destroy();
  await popup.close();

  return result.text ?? '';
}

function getStatusByRequest(pdfText: string, requestName: string): string | null {
  const normalizedText = pdfText.replace(/\s+/g, ' ').trim();

  const regex = new RegExp(
    `SR\\d+-\\s*\\d+-\\d+\\s+Unit\\s+(Completed|InProgress|Pending|Rejected|Open)\\s+(Yes|No)\\s+\\d+\\s+${requestName}\\b`,
    'i'
  );

  const match = normalizedText.match(regex);
  return match ? match[1] : null;
}

test('login to JCI Solution portal', async ({ page }) => {
  test.setTimeout(5 * 60 * 1000);

  await page.goto('https://jcibe--uat.sandbox.my.site.com/Solution/', {
    waitUntil: 'domcontentloaded'
  });

  await page.locator(`//button[text()='Sign In']`).waitFor({ state: 'visible' });
  await page.locator(`//button[text()='Sign In']`).click();

  const username = page.locator(`//input[@name='inputEmail']`);
  const password = page.locator(`//input[@name='inputPassword']`);

  await expect(username).toBeVisible({ timeout: 30000 });
  await username.fill('larry.bird.uat@jci.com.hn.uat');

  await expect(password).toBeVisible({ timeout: 30000 });
  await password.fill('!Ua1Hd7!a%6I*BR#');

  const submit = page.locator(`//button[text()='Sign In']`).first();
  await expect(submit).toBeVisible({ timeout: 15000 });
  await submit.click();

  await page.waitForTimeout(5000);

  await page.goto('https://jcibe--uat.sandbox.my.site.com/SolutionNavigator/SelNav_UI_EstimateNew?id=aAdWD000000SzdG0AS&expId=');

  await page
    .locator('iframe[name="canvas-outer-_:SelNav_Prod:mycanvas1"]')
    .contentFrame()
    .locator('iframe[name="canvas-inner-_:SelNav_Prod:mycanvas1"]')
    .contentFrame()
    .getByRole('tab', { name: 'Special Requests' })
    .click();

  const pdfExportHandle = page
    .locator('iframe[name="canvas-outer-_:SelNav_Prod:mycanvas1"]')
    .contentFrame()
    .locator('iframe[name="canvas-inner-_:SelNav_Prod:mycanvas1"]')
    .contentFrame()
    .locator('#sr_iframe')
    .contentFrame()
    .locator('i');

  
  const pdfText = await getPdfTextFromPopup(page, pdfExportHandle);

  const status1 = getStatusByRequest(pdfText, 'SRRequest_1');
  const status2 = getStatusByRequest(pdfText, 'SRRequest_2');

  console.log('SRRequest_1 status:', status1);
  console.log('SRRequest_2 status:', status2);

  expect(status1).toBe('Completed');
  expect(status2).toBe('InProgress');


});

