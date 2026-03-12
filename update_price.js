const fs = require("fs");
const { chromium } = require("playwright");

(async () => {

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto("https://petrolimex.com.vn", { waitUntil: "networkidle" });

await page.waitForTimeout(3000);

const rows = await page.$$eval("table tr", trs =>
trs.map(tr => tr.innerText)
);

let price = {
ron95:"00.000",
e5:"00.000",
do001:"00.000",
do005:"00.000"
};

rows.forEach(r=>{

if(r.includes("RON 95") && price.ron95==="00.000")
price.ron95 = r.split(" ")[2];

if(r.includes("E5") && price.e5==="00.000")
price.e5 = r.split(" ")[2];

if(r.includes("DO 0,001"))
price.do001 = r.split(" ")[2];

if(r.includes("DO 0,05"))
price.do005 = r.split(" ")[2];

});

fs.writeFileSync("price.json",JSON.stringify(price,null,2));

console.log(price);

await browser.close();

})();
