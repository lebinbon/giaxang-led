const https = require("https");
const fs = require("fs");

function getHTML() {
  return new Promise((resolve, reject) => {

    https.get("https://petrolimex.com.vn", (res) => {

      let data = "";

      res.on("data", chunk => data += chunk);

      res.on("end", () => resolve(data));

    }).on("error", reject);

  });
}

function getPrice(text, name){

const regex = new RegExp(name + "[^0-9]+([0-9]{2}\\.[0-9]{3})");

const match = text.match(regex);

return match ? match[1] : "00.000";

}

async function run(){

const html = await getHTML();

const text = html.replace(/\s+/g," ");

const price = {

ron95: getPrice(text,"RON 95-III"),
e5: getPrice(text,"E5 RON 92"),
do001: getPrice(text,"DO 0,001"),
do005: getPrice(text,"DO 0,05")

};

fs.writeFileSync("price.json",JSON.stringify(price,null,2));

console.log(price);

}

run();
