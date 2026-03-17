const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function updatePrice() {
    try {
        console.log("🚀 Đang truy cập Webgia...");
        const { data } = await axios.get('https://webgia.com/gia-xang-dau/petrolimex/', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 15000
        });

        const $ = cheerio.load(data);
        const prices = { p95: "00.000", do001: "00.000", do05: "00.000" };

        $('tr').each((i, el) => {
            const rowText = $(el).text().toUpperCase();
            const cells = $(el).find('td');

            if (cells.length >= 2) {
                // Lấy giá trị ở cột 2 (Vùng 1)
                const valueV1 = cells.eq(1).text().trim();
                
                // Chỉ lấy nếu giá trị đúng định dạng tiền (XX.XXX)
                if (/\d{2}\.\d{3}/.test(valueV1)) {
                    if (rowText.includes('95-III')) prices.p95 = valueV1;
                    if (rowText.includes('0,001S-V') || rowText.includes('0.001S-V')) prices.do001 = valueV1;
                    if (rowText.includes('0,05S-II') || rowText.includes('0.05S-II')) prices.do05 = valueV1;
                }
            }
        });

        console.log("📊 Kết quả quét được:", prices);

        // HTML giao diện chuẩn cho LED
        const html = `<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{margin:0;background:transparent;color:#FFD700;font-family:"Arial Narrow",Arial;font-size:20px;font-weight:bold;overflow:hidden;white-space:nowrap;text-shadow:1px 1px 2px #000;}.container{width:100%;height:100vh;display:flex;align-items:center;justify-content:center;padding:0 5px;box-sizing:border-box;}.label{color:#FFFFFF;margin-right:10px;}.item{display:flex;align-items:center;}.price-value{color:#00FF00;margin-left:5px;}.separator{color:#FFFFFF;opacity:0.6;margin:0 8px;}</style></head><body><div class="container"><span class="label">GIÁ BÁN LẺ (Đ/L):</span><div class="item"><span>XĂNG RON 95-III</span><span class="price-value">${prices.p95}</span></div><span class="separator">|</span><div class="item"><span>DẦU DO 0,001S-V</span><span class="price-value">${prices.do001}</span></div><span class="separator">|</span><div class="item"><span>DẦU DO 0,05S-II</span><span class="price-value">${prices.do05}</span></div></div></body></html>`;

        fs.writeFileSync('giaxang_v1.html', html);
        fs.writeFileSync('price.json', JSON.stringify({ ...prices, update: new Date().toLocaleString() }, null, 2));
        console.log("✅ Đã cập nhật xong!");

    } catch (e) {
        console.error("❌ Lỗi:", e.message);
    }
}
updatePrice();
