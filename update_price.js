const https = require("https");
const fs = require("fs");

https.get(
"https://www.petrolimex.com.vn/ServicePetrolimex.svc/GetPrice",
(res)=>{

let data="";

res.on("data",chunk=>data+=chunk);

res.on("end",()=>{

const json=JSON.parse(data);

const price={
ron95:"00.000",
e5:"00.000",
do001:"00.000",
do005:"00.000"
};

json.forEach(p=>{

if(p.ProductName.includes("RON 95"))
price.ron95=p.Price1;

if(p.ProductName.includes("E5"))
price.e5=p.Price1;

if(p.ProductName.includes("DO 0,001"))
price.do001=p.Price1;

if(p.ProductName.includes("DO 0,05"))
price.do005=p.Price1;

});

fs.writeFileSync(
"price.json",
JSON.stringify(price,null,2)
);

console.log(price);

});

});
