const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Hàm format giá: Biến 25570 thành 25.570
function formatV3(price) {
    if (!price) return "00.000";
    let num = price.toString().replace(/\D/g, '');
    if (num.length <= 3) return num;
    return num.slice(0, -3) + '.' + num.slice(-3);
}

async function updatePrice() {
    try {
        console.log("🚀 Đang lấy giá từ Petajico Hà Nội (Nhanh nhất)...");

        let v1 = { p95: "00.000", do001: "00.000", do05: "00.000" };
        let v2 = { p95: "00.000", do001: "00.000", do05: "00.000" };

        // --- 1. LẤY GIÁ V1 & V2 TỪ PETAJICO HÀ NỘI ---
        try {
            const resWeb = await axios.get('https://petajicohanoi.petrolimex.com.vn/', { 
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 10000
            });
            const $ = cheerio.load(resWeb.data);

            // Tìm bảng giá trong các dòng (tr) của Petajico
            $('tr').each((i, el) => {
                const rowText = $(el).text().toUpperCase();
                // Tìm tất cả các số có định dạng giá (ví dụ 25.570) trong dòng
                const matches = $(el).text().match(/(\d{2}\.\d{3})/g);
                
                if (matches && matches.length >= 2) {
                    if (rowText.includes('95-III')) { 
                        v1.p95 = matches[0]; 
                        v2.p95 = matches[1]; 
                    }
                    if (rowText.includes('0,001S-V')) { 
                        v1.do001 = matches[0]; 
                        v2.do001 = matches[1]; 
                    }
                    if (rowText.includes('0,05S-II')) { 
                        v1.do05 = matches[0]; 
                        v2.do05 = matches[1]; 
                    }
                }
            });
            console.log("✅ Đã cập nhật giá từ Petajico!");
        } catch (e) { 
            console.log("⚠️ Lỗi lấy giá Petajico: " + e.message); 
        }

        // --- 2. LẤY GIÁ V3 TỪ GOOGLE SHEETS (GIỮ NGUYÊN) ---
        let v3 = { p95: "00.000", do001: "00.000", do05: "00.000" };
        try {
            const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRsyRFDGG8UiJcYfGgx24Du24cFSiwexQ1BoYpuVaPW4QKfnZ3o5-SMCTp5tKsRGxvlPRih5gY90Pki/pub?gid=0&single=true&output=csv';
            const responseCsv = await axios.get(csvUrl);
            const rows = responseCsv.data.split('\n');
            rows.forEach(row => {
                const cells = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
                if (cells.length >= 2) {
                    const name = cells[0].toUpperCase();
                    const rawPrice = cells[1].replace(/"/g, '').trim();
                    if (name.includes('95')) v3.p95 = formatV3(rawPrice);
                    if (name.includes('0,001') || name.includes('0.001')) v3.do001 = formatV3(rawPrice);
                    if (name.includes('0,05') || name.includes('0.05')) v3.do05 = formatV3(rawPrice);
                }
            });
        } catch (e) { console.log("Lỗi V3: " + e.message); }

        // --- 3. HÀM TẠO HTML (GIỮ NGUYÊN GIAO DIỆN CỦA GIANG) ---
        const generateHTML = (prices) => `
<!DOCTYPE html><html><head><meta charset='utf-8'><style>
body{margin:0;background:transparent;color:#FFD700;font-family:"Arial Narrow",Arial;font-size:20px;font-weight:bold;overflow:hidden;white-space:nowrap;text-shadow:1px 1px 2px #000;}
.container{width:100%;height:100vh;display:flex;align-items:center;justify-content:center;}
.label{color:#FFFFFF;margin-right:10px;}
.price-value{color:#00FF00;margin-left:5px;}
.separator{color:#FFFFFF;opacity:0.6;margin:0 15px;}
</style></head><body><div class="container">
<span class="label">GIÁ BÁN LẺ (Đ/L):</span>
<span>XĂNG RON 95-III:</span><span class="price-value">${prices.p95}</span><span class="separator">|</span>
<span>DẦU DO 0,001S-V:</span><span class="price-value">${prices.do001}</span><span class="separator">|</span>
<span>DẦU DO 0,05S-II:</span><span class="price-value">${prices.do05}</span>
</div></body></html>`;

        fs.writeFileSync('giaxang_v1.html', generateHTML(v1));
        fs.writeFileSync('giaxang_v2.html', generateHTML(v2));
        fs.writeFileSync('giaxang_v3.html', generateHTML(v3));
        
        console.log("✅ Xong! V1:", v1.p95, "V3:", v3.p95);
    } catch (e) { console.error("❌ Lỗi:", e.message); }
}
updatePrice();
