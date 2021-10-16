const { firefox } = require('playwright');
const fs = require('fs')
const ObjectsToCsv = require('objects-to-csv');


//let results = [];

let searchData;
let prices = "";
let csvHeader = "Product Name, Owned State, Product Price, Price Before Discount, Shipping Status" + "\n";
//These functions help to get search term data and output search results in files
// Input File: search_terms.txt
// Output File: output.csv
// do NOT add a newline character to the last term in input file.
function readFile(){
  fs.readFile('search_terms.txt', 'utf8' , (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    searchData = data.toString().replace(/\r\n/g,'\n').split('\n');
  });
}
function resetFile(){
  fs.writeFile(
    'output_prices.csv',
    "",
    
    err => {
      if (err) {
        console.error(err)
        return
      }
  })
}
function writeFile(str){
  fs.appendFile(
    'output_prices.csv',
    str,
    
    err => {
      if (err) {
        console.error(err)
        return
      }
  })
}

function storeInDatabase(productName, ownedState, price, priceBeforeDiscount, shippingStatus){
  // 🎯 TODO: remove commas from both prices, and product name -> ✅Done
  //Regex to remove commas in prices
  const search = ',';
  const replacer = new RegExp(search, 'g')
  const replacingChar = '';
  price = price.replace( replacer, replacingChar);
  priceBeforeDiscount = priceBeforeDiscount.replace( replacer, replacingChar);

  let csvLine = 
    productName         + ", " +
    ownedState          + ", " +
    price               + ", " +
    priceBeforeDiscount + ", " +
    shippingStatus      + "\n"
  
  writeFile(csvLine);
  //Finally Done.
}


/***************************************
👉 Scrapped Data checklist:

✅ thumbnail
✅ productName
✅ ownedState
✅ price
✅ priceBeforeDiscount
✅ shippingStatus
❌ starRating   👈 I don't think we need this for now

****************************************/

async function scrapInfo(page){
  // Scrap data according to the sheet
  
  await page.waitForSelector(".lvresult h3");
  const productName = await page.$eval(".lvresult h3", el => el.innerText);
  console.log(productName);
  
  await page.waitForSelector(".lvpic");
  const thumbnail = await page.$(".lvpic");
  thumbnail.screenshot({path: 'Images/' + productName + '.png'});
  
  await page.waitForSelector(".lvsubtitle");
  const ownedState = await page.$eval(".lvsubtitle", el => el.innerText);
  console.log(ownedState);
  
  await page.waitForSelector(".lvprice > .bold");
  const price = await page.$eval(".lvprice > .bold", el => el.innerText);
  console.log(price);

  // 🎯 TODO: Check if it exists
  await page.waitForSelector(".lvprices .stk-thr");
  const priceBeforeDiscount = await page.$eval(".lvprices .stk-thr", el => el.innerText);
  console.log(priceBeforeDiscount);
  
  // 🎯 TODO: Check if it exists
  await page.waitForSelector(".lvshipping");
  const shippingStatus = await page.$eval(".lvshipping", el => el.innerText);
  console.log(shippingStatus);

  // 🎯 TODO: click on the link and scrap further info, e.g. Condition

  // Give it some time to collect and store the data
  storeInDatabase(productName, ownedState, price, priceBeforeDiscount, shippingStatus);
  await page.waitForTimeout(2000)
}

async function getProducts(browser, searchTerm){
  const context = await browser.newContext({ storageState: 'state.json' });
  const page = await context.newPage();
  await page.goto('https://www.ebay.com/');
  await page.click('text=Advanced');
  await page.waitForSelector('text=Search')
  await page.fill('#_nkw', searchTerm)
  await page.click('button:has-text("Search")')
  console.log("Clicked Search...")
  
  // await page.waitForSelector('.rbx:has-text("Worldwide")')
  await page.waitForSelector('text=Worldwide')
  console.log("Going to click worldwide...")
  await page.click('text=Worldwide')
  scrapInfo(page).then( () => context.close());
  
}


async function main() {
  readFile();
  
  const browser = await firefox.launch({
    headless: false
  });
  resetFile();
  prices = csvHeader;
  writeFile(prices);
  
  async function temp(searchData, browser){
    for (let searchTerm of searchData)
    {
      await getProducts(browser, searchTerm);
    }
    await sleep(2000);
  } 
  temp(searchData, browser).then( ()=> process.exit())
  return 0;
}

main();

// Helper function to make the program wait for data storage
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}