const https = require("https");
const fs = require("fs");

const url = "https://www.petrolimex.com.vn/api/petrolprice";

https.get(url, (res) => {

let data = "";

res.on("data", chunk => data += chunk);

res.on("end", () => {

const json = JSON.parse(data);

const price = {
ron95: json.find(x => x.name.includes("RON 95")).price1,
e5: json.find(x => x.name.includes("E5")).price1,
do001: json.find(x => x.name.includes("DO 0,001")).price1,
do005: json.find(x => x.name.includes("DO 0,05")).price1
};

function format(v){
return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g,".");
}

const result = {
ron95: format(price.ron95),
e5: format(price.e5),
do001: format(price.do001),
do005: format(price.do005)
};

fs.writeFileSync("price.json",JSON.stringify(result,null,2));

console.log(result);

});

});
