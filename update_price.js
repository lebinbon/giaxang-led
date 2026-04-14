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
        console.log("🚀 Đang quét giá (Chế độ chống quảng cáo)...");
        let v1 = { p95: "0", do001: "0", do05: "0" };
        let v2 = { p95: "0", do001: "0", do05: "0" };
        let v3 = { p95: "0", do001: "0", do05: "0" };

        try {
            const resWeb = await axios.get('https://giaxanghomnay.com/gia-xang-hom-nay', { 
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } 
            });
            const $ = cheerio.load(resWeb.data);
            
            // Quét tất cả các dòng tr, không quan tâm nó nằm trong bảng nào (để tránh popup)
            $('tr').each((i, el) => {
                const rowText = $(el).text().toUpperCase().replace(/\s+/g, ' ');
                const cols = $(el).find('td');
                
                if (cols.length >= 3) {
                    const p1 = formatPrice($(cols[1]).text().trim());
                    const p2 = formatPrice($(cols[2]).text().trim());

                    // Dùng regex để tìm chính xác cụm từ xăng dầu, tránh bị lẫn với văn bản quảng cáo
                    if (/RON 95-III|RON95-III/.test(rowText)) { v1.p95 = p1; v2.p95 = p2; }
                    else if (/0,001S-V|0.001S-V/.test(rowText)) { v1.do001 = p1; v2.do001 = p2; }
                    else if (/0,05S-II|0.05S-II/.test(rowText)) { v1.do05 = p1; v2.do05 = p2; }
                }
            });
        } catch (e) { console.log("⚠️ Lỗi Web: " + e.message); }

        // --- BƯỚC 2: APPSHEET DỰ PHÒNG ---
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
                        // Nếu web bị popup chặn (trả về 0), lấy ngay giá từ AppSheet bù vào
                        else if (name.includes('V1')) {
                            if (v1.p95 === "0" && name.includes('95')) v1.p95 = price;
                            if (v1.do001 === "0" && name.includes('0,001')) v1.do001 = price;
                            if (v1.do05 === "0" && name.includes('0,05')) v1.do05 = price;
                        } else if (name.includes('V2')) {
                            if (v2.p95 === "0" && name.includes('95')) v2.p95 = price;
                            if (v2.do001 === "0" && name.includes('0,001')) v2.do001 = price;
                            if (v2.do05 === "0" && name.includes('0,05')) v2.do05 = price;
                        }
                    }
                }
            });
        } catch (e) { console.log("⚠️ Lỗi AppSheet: " + e.message); }

        // --- BƯỚC 3: XUẤT HTML ---
        const draw = (p) => {
            const fp = {
                p95: p.p95 === "0" ? "00.000" : p.p95,
                do001: p.do001 === "0" ? "00.000" : p.do001,
                do05: p.do05 === "0" ? "00.000" : p.do05
            };
            return `<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{margin:0;background:transparent;color:#FFD700;font-family:"Arial Narrow",Arial;font-size:20px;font-weight:bold;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100vh;text-shadow:1px 1px 2px #000;}.l{color:#FFFFFF;margin-right:10px;}.v{color:#00FF00;margin-left:5px;}.s{color:#FFFFFF;opacity:0.6;margin:0 15px;}</style></head><body><div><span class="l">GIÁ BÁN LẺ (Đ/L):</span>RON 95-III: <span class="v">${fp.p95}</span><span class="s">|</span>DO 0,001S-V: <span class="v">${fp.do001}</span><span class="s">|</span>DO 0,05S-II: <span class="v">${fp.do05}</span></div></body></html>`;
        };

        fs.writeFileSync('giaxang_v1.html', draw(v1));
        fs.writeFileSync('giaxang_v2.html', draw(v2));
        fs.writeFileSync('giaxang_v3.html', draw(v3));

        console.log(`✅ Kết quả cuối: V1: ${v1.p95} | V2: ${v2.p95} | BN: ${v3.p95}`);
    } catch (err) { console.log("Lỗi: " + err.message); }
}
updatePrice();
