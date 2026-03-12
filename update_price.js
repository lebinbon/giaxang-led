const https = require("https");
const fs = require("fs");

const PRICE_FILE = "price.json";

function getHTML() {
  return new Promise((resolve, reject) => {

    https.get("https://www.petrolimex.com.vn", res => {

      let data = "";

      res.on("data", chunk => data += chunk);

      res.on("end", () => resolve(data));

    }).on("error", reject);

  });
}

function findPrice(html, keyword) {

  const regex = new RegExp(keyword + "[^0-9]*(\\d{2}\\.\\d{3})");

  const match = html.match(regex);

  return match ? match[1] : "00.000";
}

async function run() {

  const html = await getHTML();

  const price = {

    ron95: findPrice(html, "RON 95"),
    e5: findPrice(html, "E5"),
    do001: findPrice(html, "0,001"),
    do005: findPrice(html, "0,05")

  };

  fs.writeFileSync(PRICE_FILE, JSON.stringify(price, null, 2));

  console.log("Updated:", price);
}

run();
