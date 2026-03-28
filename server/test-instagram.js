require('dotenv').config();
const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ headless: false, slowMo: 800 });
  const page = await browser.newPage();

  await page.goto('https://www.instagram.com/accounts/login/');
  await page.waitForTimeout(4000);

  // Take screenshot to see what's there
  await page.screenshot({ path: 'before-login.png' });
  console.log('Screenshot saved - check before-login.png');

  // Log all input fields found on page
  const inputs = await page.$$eval('input', els => 
    els.map(el => ({ name: el.name, type: el.type, placeholder: el.placeholder }))
  );
  console.log('Inputs found:', inputs);

  await browser.close();
}

test();