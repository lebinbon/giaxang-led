const { chromium } = require("playwright");
const fs = require("fs");

async function run() {

  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  await page.goto("https://www.petrolimex.com.vn", {
    timeout: 120000,
    waitUntil: "domcontentloaded"
  });

  await page.waitForTimeout(5000);

  const text = await page.textContent("body");

  function findPrice(keyword) {
    const regex = new RegExp(keyword + ".*?(\\d{2}\\.\\d{3})");
    const match = text.match(regex);
    return match ? match[1] : "00.000";
  }

  const ron95 = findPrice("RON95");
  const e5 = findPrice("E5");

  console.log("RON95:", ron95);
  console.log("E5:", e5);

  const html1 = `
<html>
<body style="background:black;color:red;font-size:60px;text-align:center;">
E5: ${e5}<br>
RON95: ${ron95}
</body>
</html>
`;

  const html2 = `
<html>
<body style="background:black;color:yellow;font-size:60px;text-align:center;">
E5: ${e5}<br>
RON95: ${ron95}
</body>
</html>
`;

  fs.writeFileSync("giaxang_v1.html", html1);
  fs.writeFileSync("giaxang_v2.html", html2);

  await browser.close();
}

run();
