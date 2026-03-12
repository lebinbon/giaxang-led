const fs = require("fs");

async function update() {

    const res = await fetch("https://www.petrolimex.com.vn");

    const html = await res.text();

    function find(keyword) {

        const regex = new RegExp(keyword + "[^0-9]*([0-9]{2}\\.[0-9]{3})");

        const m = html.match(regex);

        return m ? m[1] : "00.000";
    }

    const data = {
        ron95: find("RON 95"),
        e5: find("E5 RON 92"),
        do001: find("0,001"),
        do05: find("0,05")
    };

    const html_out = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body{margin:0;background:black;color:#FFD700;font-family:Arial;font-size:28px;font-weight:bold}
.container{width:1872px;height:82px;display:flex;align-items:center;justify-content:space-around}
.white{color:white}
.green{color:#00FF00}
</style>
</head>
<body>
<div class="container">

<span class="white">GIÁ XĂNG PETROLIMEX</span>
<span><span class="white">RON95:</span> ${data.ron95}</span>
<span><span class="white">E5:</span> ${data.e5}</span>
<span><span class="white">DO 0.001:</span> <span class="green">${data.do001}</span></span>
<span><span class="white">DO 0.05:</span> <span class="green">${data.do05}</span></span>

</div>
</body>
</html>
`;

    fs.writeFileSync("giaxang_v1.html", html_out);
    fs.writeFileSync("giaxang_v2.html", html_out);
}

update();
