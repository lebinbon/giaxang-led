const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

async function getPrice() {

const url = "https://www.petrolimex.com.vn";

const { data } = await axios.get(url);

const text = data.replace(/\s+/g," ");

function find(keyword){

const r = new RegExp(keyword + ".*?(\\d{2}\\.\\d{3})");
const m = text.match(r);

return m ? m[1] : "00.000";

}

const price = {

ron95: find("RON 95"),
e5: find("E5"),
do001: find("0,001"),
do005: find("0,05")

};

fs.writeFileSync("price.json", JSON.stringify(price,null,2));

console.log(price);

}

getPrice();
