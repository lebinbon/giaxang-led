const fs = require("fs");

async function updatePrice() {

    const res = await fetch("https://www.petrolimex.com.vn/");
    const html = await res.text();

    function getPrice(name) {

        const regex = new RegExp(name + "[^0-9]{0,50}([0-9]{2}\\.[0-9]{3})","i");
        const match = html.match(regex);

        if(match){
            return match[1];
        }

        return "00.000";
    }

    const ron95 = getPrice("RON 95");
    const e5 = getPrice("E5 RON 92");
    const do001 = getPrice("0,001");
    const do05 = getPrice("0,05");

    console.log("RON95:",ron95);
    console.log("E5:",e5);
    console.log("DO001:",do001);
    console.log("DO05:",do05);

    const html_output = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body{
margin:0;
background:black;
color:#FFD700;
font-family:Arial;
font-size:28px;
font-weight:bold;
}

.container{
width:1872px;
height:82px;
display:flex;
align-items:center;
justify-content:space-around;
}

.white{color:white}
.green{color:#00FF00}

</style>
</head>

<body>

<div class="container">

<span class="white">GIÁ XĂNG PETROLIMEX</span>

<span><span class="white">RON95:</span> ${ron95}</span>

<span><span class="white">E5:</span> ${e5}</span>

<span><span class="white">DO 0.001:</span> <span class="green">${do001}</span></span>

<span><span class="white">DO 0.05:</span> <span class="green">${do05}</span></span>

</div>

</body>
</html>
`;

    fs.writeFileSync("giaxang_v1.html", html_output);
    fs.writeFileSync("giaxang_v2.html", html_output);

}

updatePrice();
