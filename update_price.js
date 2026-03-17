const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function updatePrice() {
    try {
        console.log("🚀 Đang truy cập Webgia lấy dữ liệu song song...");
        const { data } = await axios.get('https://webgia.com/gia-xang-dau/petrolimex/', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 15000
        });

        const $ = cheerio.load(data);
        const v1 = { p95: "00.000", do001: "00.000", do05: "00.000" };
        const v2 = { p95: "00.000", do001: "00.000", do05: "00.000" };

        $('tr').each((i, el) => {
            const rowText = $(el).text().toUpperCase();
            const cells = $(el).find('td');

            // Webgia: Cột 0: Tên | Cột 1: Vùng 1 | Cột 2: Vùng 2
            if (cells.length >= 3) {
                const val1 = cells.eq(1).text().trim(); // Lấy cột 2
                const val2 = cells.eq(2).text().trim(); // Lấy cột 3
                
                // Kiểm tra định dạng tiền XX.XXX trước khi bốc dữ liệu
                if (/\d{2}\.\d{3}/.test(val1)) {
                    if (rowText.includes('95-III')) { v1.p95 = val1; v2.p95 = val2; }
                    if (rowText.includes('0,001S-V')) { v1.do001 = val1; v2.do001 = val2; }
                    if (rowText.includes('0,05S-II')) { v1.do05 = val1; v2.do05 = val2; }
                }
            }
        });

        // Hàm tạo nội dung HTML dùng chung cho cả 2 vùng
        const generateHTML = (prices, label) => `
<!DOCTYPE html><html><head><meta charset='utf-8'><style>
body{margin:0;background:transparent;color:#FFD700;font-family:"Arial Narrow",Arial;font-size:20px;font-weight:bold;overflow:hidden;white-space:nowrap;text-shadow:1px 1px 2px #000;}
.container{width:100%;height:100vh;display:flex;align-items:center;justify-content:center;padding:0 5px;box-sizing:border-box;}
.label{color:#FFFFFF;margin-right:10px;}
.item{display:flex;align-items:center;}
.price-value{color:#00FF00;margin-left:5px;}
.separator{color:#FFFFFF;opacity:0.6;margin:0 8px;}
</style></head><body><div class="container">
<span class="label">GIÁ ${label} (Đ/L):</span>
<div class="item"><span>XĂNG RON 95-III</span><span class="price-value">${prices.p95}</span></div>
<span class="separator">|</span>
<div class="item"><span>DẦU DO 0,001S-V</span><span class="price-value">${prices.do001}</span></div>
<span class="separator">|</span>
<div class="item"><span>DẦU DO 0,05S-II</span><span class="price-value">${prices.do05}</span></div>
</div></body></html>`;

        // Xuất file Vùng 1
        fs.writeFileSync('giaxang_v1.html', generateHTML(v1, "VÙNG 1"));
        // Xuất file Vùng 2
        fs.writeFileSync('giaxang_v2.html', generateHTML(v2, "VÙNG 2"));
        // Xuất file JSON tổng hợp
        fs.writeFileSync('price.json', JSON.stringify({ v1, v2, update: new Date().toLocaleString() }, null, 2));

        console.log("📊 V1:", v1);
        console.log("📊 V2:", v2);
        console.log("✅ Đã cập nhật xong cả 2 vùng!");

    } catch (e) {
        console.error("❌ Lỗi:", e.message);
    }
}
updatePrice();
