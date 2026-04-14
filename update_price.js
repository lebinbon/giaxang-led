const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');

function formatPrice(price) {
    if (!price || price === "" || price === "0") return "0";
    let num = price.toString().replace(/\D/g, ''); 
    if (num.length <= 3) return num;
    return num.slice(0, -3) + '.' + num.slice(-3);
}

async function updatePrice() {
    try {
        console.log("🚀 Đang quét giá từ giaxanghomnay.com...");
        let v1 = { p95: "0", do001: "0", do05: "0" };
        let v2 = { p95: "0", do001: "0", do05: "0" };
        let v3 = { p95: "0", do001: "0", do05: "0" };

        // --- BƯỚC 1: LẤY GIÁ TỪ WEB (QUÉT TẤT CẢ CÁC BẢNG ĐỂ TÌM DỮ LIỆU CHUẨN) ---
        try {
            const resWeb = await axios.get('https://giaxanghomnay.com/gia-xang-hom-nay', { 
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } 
            });
            const $ = cheerio.load(resWeb.data);
            
            $('tr').each((i, el) => {
                const cols = $(el).find('td');
                // Chỉ xử lý dòng có ít nhất 3 cột (Tên mặt hàng | Vùng 1 | Vùng 2)
                if (cols.length >= 3) {
                    const rowText = $(el).text().toUpperCase();
                    const p1 = formatPrice($(cols[1]).text().trim());
                    const p2 = formatPrice($(cols[2]).text().trim());

                    // Chỉ gán nếu p1 và p2 thực sự có giá (khác 0)
                    if (p1 !== "0" && p2 !== "0") {
                        if (rowText.includes('RON 95-III')) { v1.p95 = p1; v2.p95 = p2; }
                        else if (rowText.includes('0,001S-V')) { v1.do001 = p1; v2.do001 = p2; }
                        else if (rowText.includes('0,05S-II')) { v1.do05 = p1; v2.do05 = p2; }
                    }
                }
            });
        } catch (e) { console.log("⚠️ Lỗi Web: " + e.message); }

        // --- BƯỚC 2: LẤY GIÁ BẮC NINH TỪ APPSHEET ---
        try {
            const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRsyRFDGG8UiJcYfGgx24Du24cFSiwexQ1BoYpuVaPW4QKfnZ3o5-SMCTp5tKsRGxvlPRih5gY90Pki/pub?gid=0&single=true&output=csv';
            const resCsv = await axios.get(csvUrl + '&t=' + Date.now());
            const rows = resCsv.data.split('\n');

            rows.forEach(row => {
                const cells = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if (cells.length >= 2) {
                    const name = cells[0].toUpperCase().trim();
                    const price = formatPrice(cells[1].replace(/"/g, '').trim());

                    if (price !== "0") {
                        if (!name.includes('V1') && !name.includes('V2')) {
                            if (name.includes('95')) v3.p95 = price;
                            if (name.includes('0,001')) v3.do001 = price;
                            if (name.includes('0,05')) v3.do05 = price;
                        }
                    }
                }
            });
        } catch (e) { console.log("⚠️ Lỗi AppSheet: " + e.message); }

        // --- BƯỚC 3: XUẤT FILE HTML (MẪU CHUẨN CỦA BẠN) ---
        const draw = (p) => {
            const fp = {
                p95: p.p95 === "0" ? "00.000" : p.p95,
                do001: p.do001 === "0" ? "00.000" : p.do001,
                do05: p.do05 === "0" ? "00.000" : p.do05
            };
            return `<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{margin:0;background:transparent;color:#FFD700;font-family:"Arial Narrow",Arial;font-size:20px;font-weight:bold;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100vh;text-shadow:1px 1px 2px #000;}.l{color:#FFFFFF;margin-right:10px;}.v{color:#00FF00;margin-left:5px;}.s{color:#FFFFFF;opacity:0.6;margin:0 15px;}</style></head><body><div class="container"><span class="l">GIÁ BÁN LẺ (Đ/L):</span>XĂNG RON 95-III: <span class="v">${fp.p95}</span><span class="s">|</span>DẦU DO 0,001S-V: <span class="v">${fp.do001}</span><span class="s">|</span>DẦU DO 0,05S-II: <span class="v">${fp.do05}</span></div></body></html>`;
        };

        fs.writeFileSync('giaxang_v1.html', draw(v1));
        fs.writeFileSync('giaxang_v2.html', draw(v2));
        fs.writeFileSync('giaxang_v3.html', draw(v3));

        console.log(`✅ Hoàn tất! V1: ${v1.p95} | V2: ${v2.p95} | BN: ${v3.p95}`);
    } catch (error) { console.log("Lỗi: " + error.message); }
}
updatePrice();
