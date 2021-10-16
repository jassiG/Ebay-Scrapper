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
  console.log("Cookies Storage Done Successfully!")
}


async function main() {
  // 🎯 TODO: Add Cookie Backup Functionality to keep previous data in a folder
  // backupCurrentCookie(); 
  const browser = await firefox.launch({
    headless: false
  });
  await getCookies(browser);
  await sleep(5000);
  return 0;
}

main();

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}