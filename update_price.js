const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Hàm format giá V3: 25570 -> 25.570
function formatV3(price) {
    if (!price) return "00.000";
    let num = price.toString().replace(/\D/g, '');
    if (num.length <= 3) return num;
    return num.slice(0, -3) + '.' + num.slice(-3);
}

async function updatePrice() {
    try {
        console.log("🚀 Đang kết nối Petajico Hà Nội...");

        let v1 = { p95: "00.000", do001: "00.000", do05: "00.000" };
        let v2 = { p95: "00.000", do001: "00.000", do05: "00.000" };

        // --- 1. LẤY GIÁ TỪ PETAJICO ---
        try {
            const res = await axios.get('https://petajicohanoi.petrolimex.com.vn/', {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html'
                },
                timeout: 15000
            });
            
            const $ = cheerio.load(res.data);
            // Lấy toàn bộ text của trang web để quét cho chắc
            const webText = $('body').text().toUpperCase();

            // Hàm bóc tách giá dựa trên từ khóa
            const extract = (keyword) => {
                const regex = new RegExp(keyword + ".*?(\\d{2}\\.\\d{3}).*?(\\d{2}\\.\\d{3})", "s");
                const match = webText.match(regex);
                return match ? { v1: match[1], v2: match[2] } : null;
            };

            const p95 = extract('95-III');
            const do001 = extract('0,001S-V');
            const do05 = extract('0,05S-II');

            if (p95) { v1.p95 = p95.v1; v2.p95 = p95.v2; }
            if (do001) { v1.do001 = do001.v1; v2.do001 = do001.v2; }
            if (do05) { v1.do05 = do05.v1; v2.do05 = do05.v2; }

            console.log("✅ Kết quả bóc tách Petajico:", { v1, v2 });
        } catch (e) { console.log("⚠️ Lỗi bốc giá Petajico: " + e.message); }

        // --- 2. LẤY GIÁ V3 TỪ APPSHEET (GIỮ NGUYÊN) ---
        let v3 = { p95: "00.000", do001: "00.000", do05: "00.000" };
        try {
            const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRsyRFDGG8UiJcYfGgx24Du24cFSiwexQ1BoYpuVaPW4QKfnZ3o5-SMCTp5tKsRGxvlPRih5gY90Pki/pub?gid=0&single=true&output=csv';
            const resCsv = await axios.get(csvUrl);
            const rows = resCsv.data.split('\n');
            rows.forEach(row => {
                const cells = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if (cells.length >= 2) {
                    const name = cells[0].toUpperCase();
                    const raw = cells[1].replace(/"/g, '').trim();
                    if (name.includes('95')) v3.p95 = formatV3(raw);
                    if (name.includes('0,001') || name.includes('0.001')) v3.do001 = formatV3(raw);
                    if (name.includes('0,05') || name.includes('0.05')) v3.do05 = formatV3(raw);
                }
            });
        } catch (e) { console.log("Lỗi V3: " + e.message); }

        // --- 3. TẠO HTML (GIỮ GIAO DIỆN CHUẨN CỦA GIANG) ---
        const draw = (p) => `
<!DOCTYPE html><html><head><meta charset='utf-8'><style>
body{margin:0;background:transparent;color:#FFD700;font-family:"Arial Narrow",Arial;font-size:20px;font-weight:bold;overflow:hidden;white-space:nowrap;text-shadow:1px 1px 2px #000;}
.container{width:100%;height:100vh;display:flex;align-items:center;justify-content:center;}
.label{color:#FFFFFF;margin-right:10px;}
.price-value{color:#00FF00;margin-left:5px;}
.separator{color:#FFFFFF;opacity:0.6;margin:0 15px;}
</style></head><body><div class="container">
<span class="label">GIÁ BÁN LẺ (Đ/L):</span>
<span>XĂNG RON 95-III:</span><span class="price-value">${p.p95}</span><span class="separator">|</span>
<span>DẦU DO 0,001S-V:</span><span class="price-value">${p.do001}</span><span class="separator">|</span>
<span>DẦU DO 0,05S-II:</span><span class="price-value">${p.do05}</span>
</div></body></html>`;

        fs.writeFileSync('giaxang_v1.html', draw(v1));
        fs.writeFileSync('giaxang_v2.html', draw(v2));
        fs.writeFileSync('giaxang_v3.html', draw(v3));
        console.log("🚀 HOÀN TẤT!");
    } catch (e) { console.error("❌ Lỗi nặng:", e.message); }
}
updatePrice();
