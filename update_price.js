const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function updatePrice() {
    try {
        console.log("🚀 Đang cập nhật giá Petrolimex V1, V2, V3...");

        // --- 1. LẤY GIÁ V1 & V2 TỪ WEBGIA ---
        let v1 = { p95: "00.000", do001: "00.000", do05: "00.000" };
        let v2 = { p95: "00.000", do001: "00.000", do05: "00.000" };

        try {
            const resWeb = await axios.get('https://webgia.com/gia-xang-dau/petrolimex/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(resWeb.data);
            $('tr').each((i, el) => {
                const row = $(el).text().toUpperCase();
                const matches = $(el).text().match(/(\d{2}\.\d{3})/g);
                if (matches && matches.length >= 2) {
                    if (row.includes('95-III')) { v1.p95 = matches[0]; v2.p95 = matches[1]; }
                    if (row.includes('0,001S-V')) { v1.do001 = matches[0]; v2.do001 = matches[1]; }
                    if (row.includes('0,05S-II')) { v1.do05 = matches[0]; v2.do05 = matches[1]; }
                }
            });
        } catch (e) { console.log("Lỗi Webgia, dùng giá mặc định."); }

        // --- 2. LẤY GIÁ V3 TỪ APPSHEET (LINK CSV CỦA GIANG) ---
        let v3 = { p95: "00.000", do001: "00.000", do05: "00.000" };
        try {
            const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRsyRFDGG8UiJcYfGgx24Du24cFSiwexQ1BoYpuVaPW4QKfnZ3o5-SMCTp5tKsRGxvlPRih5gY90Pki/pub?gid=0&single=true&output=csv';
            const resCsv = await axios.get(csvUrl);
            const rows = resCsv.data.split('\n');
            rows.forEach(row => {
                const cells = row.split(',');
                if (cells.length >= 2) {
                    const name = cells[0].toUpperCase();
                    const price = cells[1].trim();
                    if (name.includes('95-III')) v3.p95 = price;
                    if (name.includes('0,001S-V')) v3.do001 = price;
                    if (name.includes('0,05S-II')) v3.do05 = price;
                }
            });
        } catch (e) { console.log("Lỗi V3 Sheets: " + e.message); }

        // --- 3. ĐOẠN HTML MÀ GIANG ĐANG TÌM ĐÂY ---
        // Mình đưa vào hàm generateHTML để dùng chung cho cả 3 file cho gọn
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

        // --- 4. XUẤT RA 3 FILE ---
        fs.writeFileSync('giaxang_v1.html', generateHTML(v1));
        fs.writeFileSync('giaxang_v2.html', generateHTML(v2));
        fs.writeFileSync('giaxang_v3.html', generateHTML(v3));
        
        // Lưu JSON để theo dõi log
        fs.writeFileSync('price.json', JSON.stringify({ v1, v2, v3, update: new Date().toLocaleString() }, null, 2));

        console.log("✅ Đã cập nhật xong 3 file HTML!");
    } catch (e) { console.error("❌ Lỗi:", e.message); }
}

updatePrice();
