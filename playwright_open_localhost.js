const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(3000);
  // await browser.close();
})();
