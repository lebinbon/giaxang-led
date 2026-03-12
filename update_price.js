const https = require("https");
const fs = require("fs");

function getHTML() {
  return new Promise((resolve, reject) => {

    https.get("https://www.petrolimex.com.vn/", (res) => {

      let data = "";

      res.on("data", chunk => data += chunk);

      res.on("end", () => resolve(data));

    }).on("error", reject);

  });
}

function findPrice(text, keyword) {

  const r = new RegExp(keyword + ".*?(\\d{2}\\.\\d{3})");
  const m = text.match(r);

  return m ? m[1] : "00.000";

}

async function run() {

  const html = await getHTML();

  const text = html.replace(/\s+/g," ");

  const price = {

    ron95: findPrice(text,"RON 95"),
    e5: findPrice(text,"E5"),
    do001: findPrice(text,"0,001"),
    do005: findPrice(text,"0,05")

  };

  fs.writeFileSync("price.json", JSON.stringify(price,null,2));

  console.log(price);

}

run();
