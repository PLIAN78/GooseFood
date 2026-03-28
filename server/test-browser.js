const { chromium } = require('playwright');

async function test() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  const page = await browser.newPage();
  console.log('Opening Google...');
  await page.goto('https://www.google.com');
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'test-screenshot.png' });
  console.log('Done! Check test-screenshot.png');
  await browser.close();
}

test();