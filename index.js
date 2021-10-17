const { firefox } = require('playwright');
const fs = require('fs')
const ObjectsToCsv = require('objects-to-csv');
const replaceFirstLineOfFile = require('file-firstline-replace');

let searchData;
let csvHeader = "Product Name, Owned State, Product Price, Price Before Discount, Shipping Status, Ebay Item Number";

/****************
     
   These 3 functions help us get the search term data and output search results in files
   Input File: search_terms.txt
   Output File: output.csv
   do NOT add a newline character to the last term in input file.

*****************/

function readFile(){
  fs.readFile('search_terms.txt', 'utf8' , (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    searchData = data.toString().replace(/\r\n/g,'\n').split('\n');
  });
}

function resetFile(){
  fs.writeFile(
    'output.csv',
    "",
    
    err => {
      if (err) {
        console.error(err);
        return;
      }
  })
}
function writeFile(str){
  fs.appendFile(
    'output.csv',
    str,
    
    err => {
      if (err) {
        console.error(err);
        return;
      }
  })
}

function storeInDatabase(args){
  console.log("Finally Storing in Databse...");
  let csvLine = "";
  csvLine += args[0];
  //Regex to remove commas in prices
  const search = ',';
  const replacer = new RegExp(search, 'g');
  const replacingChar = '';
  for (let i=0; i<args.length; i++){
    args[i] = args[i].replace( replacer, replacingChar);
    if (i >= 1){
      csvLine = csvLine + ", " + args[i];
    }
  }
  csvLine += "\n";
  console.log(csvLine);
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
async function modifyCsvHeader(){
  var filename = "output.csv";
  var newHeader = csvHeader;
  replaceFirstLineOfFile(filename, newHeader, function(err) {
    if (err) throw err;
  })
}

async function getMoreInfo(page, data){
  await page.waitForSelector(".lvtitle");
  await page.click(".lvtitle > a");

  await page.waitForSelector("#descItemNumber");
  const ebayItemNumber = await page.$eval("#descItemNumber", el => el.innerText);
  console.log(ebayItemNumber);
  data.push(ebayItemNumber);

  await page.waitForSelector(".ux-labels-values__labels");
  console.log("Found Labels...");
  const itemLabels = await page.$$eval(".ux-labels-values__labels",
    elems => {
      let labels = [];
      for (let elem of elems.values()){
        //console.log(elem.innerText);
        labels.push(elem.innerText);
      }
      return labels;
  });
  await page.waitForSelector(".ux-labels-values__values");
  console.log("Found Values...");
  const itemValues = await page.$$eval(".ux-labels-values__values",
    elems => {
      let values = [];
      for (let elem of elems.values()){
        //console.log(elem.innerText);
        values.push(elem.innerText);
      }
      return values;
  });
  data.push(...itemValues);
  for (let i = 0; i < itemLabels.length; i++){
    //console.log(itemLabels[i] + " " + itemValues[i]);
    csvHeader = csvHeader + ", " + itemLabels[i];
  }
  csvHeader += "\n";
  await modifyCsvHeader();
  await page.waitForTimeout(1000);
  storeInDatabase(data);
  // Give the page some time
  await page.waitForTimeout(4000);
}

async function scrapInfo(page){
  let dataToStore = [];
  // Scrap data according to the sheet
  
  await page.waitForSelector(".lvresult h3");
  const productName = await page.$eval(".lvresult h3", el => el.innerText);
  console.log(productName);
  dataToStore.push(productName);
  
  await page.waitForSelector(".lvpic");
  const thumbnail = await page.$(".lvpic");
  thumbnail.screenshot({path: 'Images/' + productName + '.png'});
  
  await page.waitForSelector(".lvsubtitle");
  const ownedState = await page.$eval(".lvsubtitle", el => el.innerText);
  console.log(ownedState);
  dataToStore.push(ownedState);
  
  await page.waitForSelector(".lvprice > .bold");
  const price = await page.$eval(".lvprice > .bold", el => el.innerText);
  console.log(price);
  dataToStore.push(price);

  // 🎯 TODO: Check if it exists
  await page.waitForSelector(".lvprices .stk-thr");
  const priceBeforeDiscount = await page.$eval(".lvprices .stk-thr", el => el.innerText);
  console.log(priceBeforeDiscount);
  dataToStore.push(priceBeforeDiscount);
  
  // 🎯 TODO: Check if it exists
  await page.waitForSelector(".lvshipping");
  const shippingStatus = await page.$eval(".lvshipping", el => el.innerText);
  console.log(shippingStatus);
  dataToStore.push(shippingStatus);

  await getMoreInfo(page, dataToStore).then( () => context.close());
}

async function getProducts(browser, searchTerm){
  const context = await browser.newContext({ storageState: 'state.json' });
  const page = await context.newPage();
  await page.goto('https://www.ebay.com/');
  await page.click('text=Advanced');
  await page.waitForSelector('text=Search');
  await page.fill('#_nkw', searchTerm);
  await page.click('button:has-text("Search")');
  console.log("Clicked Search...");
  
  // await page.waitForSelector('.rbx:has-text("Worldwide")')
  await page.waitForSelector('text=Worldwide');
  console.log("Going to click worldwide...");
  await page.click('text=Worldwide');
  scrapInfo(page);
}


async function main() {
  readFile();
  
  const browser = await firefox.launch({
    headless: false
  });
  resetFile();
  writeFile(csvHeader);
  
  async function temp(searchData, browser){
    for (let searchTerm of searchData)
    {
      await getProducts(browser, searchTerm);
    }
    await sleep(5000);
  } 
  temp(searchData, browser).then( ()=> process.exit());
  return 0;
}

main();

// Helper function to make the program wait for data storage
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}