const https = require("https");
const fs = require("fs");

const PRICE_FILE = "last_price.json";

function fetchPrice() {

return new Promise((resolve,reject)=>{

https.get("https://www.petrolimex.com.vn",res=>{

let data="";

res.on("data",chunk=>data+=chunk);

res.on("end",()=>{

function find(keyword){

const regex=new RegExp(keyword+".*?(\\d{2}\\.\\d{3})");
const match=data.match(regex);
return match?match[1]:"00.000";

}

const e5=find("E5");
const ron95=find("RON 95");

resolve({e5,ron95});

});

}).on("error",reject);

});

}

async function run(){

const price=await fetchPrice();

let last={};

if(fs.existsSync(PRICE_FILE)){
last=JSON.parse(fs.readFileSync(PRICE_FILE));
}

if(price.e5===last.e5 && price.ron95===last.ron95){
console.log("No price change");
return;
}

fs.writeFileSync(PRICE_FILE,JSON.stringify(price));

const html=`
<html>
<head>
<meta charset="UTF-8">
<style>

body{
background:black;
color:red;
font-family:Arial;
text-align:center;
}

.box{
margin-top:120px;
}

.line{
font-size:120px;
font-weight:bold;
margin:40px;
}

</style>
</head>

<body>

<div class="box">

<div class="line">
E5 RON92 : ${price.e5}
</div>

<div class="line">
RON95-III : ${price.ron95}
</div>

</div>

</body>
</html>
`;

fs.writeFileSync("giaxang_v1.html",html);
fs.writeFileSync("giaxang_v2.html",html);

console.log("Updated:",price);

}

run();
