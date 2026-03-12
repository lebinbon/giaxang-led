const { chromium } = require('playwright');
const fs = require('fs');

async function layGia(){

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto("https://www.petrolimex.com.vn/index.html",{waitUntil:"networkidle"});

await page.getByText("Giá bán lẻ xăng dầu").first().hover();

await page.waitForTimeout(3000);

const text = (await page.textContent("body")).toUpperCase();

const lines = text.split("\n");

function findPrice(key){

for(let i=0;i<lines.length;i++){

if(lines[i].includes(key)){

for(let j=i;j<i+3;j++){

const m = lines[j].match(/(\d{2}\.\d{3})/);

if(m) return m[1];

}

}

}

return "00.000";

}

const data = {

ron95: findPrice("RON 95"),
e5: findPrice("E5"),
do001: findPrice("DO 0,001")

};

const html = `
<!DOCTYPE html>
<html>
<meta charset="utf-8">
<body style="background:black;color:yellow;font-size:30px;font-family:Arial">

GIÁ XĂNG PETROLIMEX VÙNG 1

RON95: ${data.ron95}

E5: ${data.e5}

DO 0.001: ${data.do001}

</body>
</html>
`;

fs.writeFileSync("giaxang_v1.html",html);

await browser.close();

}

layGia();
