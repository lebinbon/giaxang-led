const fs = require("fs");
const { chromium } = require("playwright");

(async () => {

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto("https://petrolimex.com.vn", { waitUntil: "networkidle" });

// hover vào menu để hiện bảng giá
await page.hover('a[href="/#"]');

await page.waitForTimeout(3000);

// lấy bảng giá
const data = await page.evaluate(() => {

const rows = Array.from(document.querySelectorAll("table tr"));

let price = {
ron95:"00.000",
e5:"00.000",
do001:"00.000",
do005:"00.000"
};

rows.forEach(r=>{

const text = r.innerText;

if(text.includes("RON 95") && !price.ron95){
price.ron95 = r.children[1].innerText;
}

if(text.includes("E5") && !price.e5){
price.e5 = r.children[1].innerText;
}

if(text.includes("DO 0,001") && !price.do001){
price.do001 = r.children[1].innerText;
}

if(text.includes("DO 0,05") && !price.do005){
price.do005 = r.children[1].innerText;
}

});

return price;

});

fs.writeFileSync("price.json",JSON.stringify(data,null,2));

console.log(data);

await browser.close();

})();
