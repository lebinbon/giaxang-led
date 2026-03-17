const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function updatePrice() {
    try {
        console.log("🚀 Đang cập nhật giá song song V1 và V2...");
        const { data } = await axios.get('https://webgia.com/gia-xang-dau/petrolimex/', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 15000
        });

        const $ = cheerio.load(data);
        const v1 = { p95: "00.000", do001: "00.000", do05: "00.000" };
        const v2 = { p95: "00.000", do001: "00.000", do05: "00.000" };

        $('tr').each((i, el) => {
            const rowText = $(el).text().toUpperCase();
            // Tìm tất cả các số dạng XX.XXX trong hàng
            const matches = $(el).text().match(/(\d{2}\.\d{3})/g);

            if (matches && matches.length >= 2) {
                const val1 = matches[0]; // Vùng 1
                const val2 = matches[1]; // Vùng 2

                if (rowText.includes('95-III')) { v1.p95 = val1; v2.p95 = val2; }
                if (rowText.includes('0,001S-V')) { v1.do001 = val1; v2.do001 = val2; }
                if (rowText.includes('0,05S-II')) { v1.do05 = val1; v2.do05 = val2; }
            }
        });

        const generateHTML = (prices) => `
<!DOCTYPE html><html><head><meta charset='utf-8'><style>
body{margin:0;background:transparent;color:#FFD700;font-family:"Arial Narrow",Arial;font-size:20px;font-weight:bold;overflow:hidden;white-space:nowrap;text-shadow:1px 1px 2px #000;}
.container{width:100%;height:100vh;display:flex;align-items:center;justify-content:center;padding:0 5px;box-sizing:border-box;}
.label{color:#FFFFFF;margin-right:10px;}
.item{display:flex;align-items:center;}
.price-value{color:#00FF00;margin-left:5px;}
.separator{color:#FFFFFF;opacity:0.6;margin:0 8px;}
</style></head><body><div class="container">
<span class="label">GIÁ BÁN LẺ (Đ/L):</span>
<div class="item"><span>XĂNG RON 95-III</span><span class="price-value">${prices.p95}</span></div>
<span class="separator">|</span>
<div class="item"><span>DẦU DO 0,001S-V</span><span class="price-value">${prices.do001}</span></div>
<span class="separator">|</span>
<div class="item"><span>DẦU DO 0,05S-II</span><span class="price-value">${prices.do05}</span></div>
</div></body></html>`;

        // Ghi đồng thời cả 2 file
        fs.writeFileSync('giaxang_v1.html', generateHTML(v1));
        fs.writeFileSync('giaxang_v2.html', generateHTML(v2));
        fs.writeFileSync('price.json', JSON.stringify({ v1, v2, update: new Date().toLocaleString() }, null, 2));

        console.log("✅ Đã cập nhật xong cả v1 và v2!");
    } catch (e) {
        console.error("❌ Lỗi:", e.message);
    }
}
updatePrice();
