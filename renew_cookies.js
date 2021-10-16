const { firefox } = require('playwright');
const fs = require('fs')



async function getCookies(browser){
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://www.ebay.com/');
  await page.click("text=Sign in");

  // Now a human will enter the credentials and then playwright will store the cookies containing credentials.
  await page.waitForSelector('#userid');
  console.log("waiting...")

  // Increase this time if you are struggling to fill captcha and credentials
  await page.waitForTimeout(35000)
  console.log("waiting over.")
  // Save cookies
  await context.storageState({ path: 'state.json' });
}


async function main() {
  
  const browser = await firefox.launch({
    headless: false
  });
  getCookies(browser);
  return 0;
}

main().then( (result) =>
  {
  }
);