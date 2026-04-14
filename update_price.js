const { google } = require('googleapis');
const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');

// CẤU HÌNH CHUẨN ĐÃ KIỂM TRA
const SHEET_ID = '1evOQY_2mYSNwrd6dH9N7aUwFV0IpVH5l37rRKc1sRM'; 
const API_KEY = 'AIzaSyADcR1RizfcOcA2-rZREhBrZKp_e5-_-so'; 
const RANGE = 'A1:B20'; // Bỏ tên Sheet1! để API tự lấy Tab đầu tiên

function formatPrice(price) {
    if (!price || price === "" || price === "0") return "0";
    let num = price.toString().replace(/\D/g, '');
    if (num.length <= 3) return num;
    return num.slice(0, -3) + '.' + num.slice(-3);
}

async function updatePrice() {
    try {
        console.log("🚀 Đang khởi động...");
        let v1 = { p95: "0", do001: "0", do05: "0" };
        let v2 = { p95: "0", do001: "0", do05: "0" };
        let v3 = { p95: "0", do001: "0", do05: "0" }; // Bắc Ninh

        // 1. QUÉT WEB GIAXANGHOMNAY
        try {
            const resWeb = await axios.get('https://giaxanghomnay.com/gia-xang-hom-nay', { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(resWeb.data);
            $('tr').each((i, el) => {
                const rowText = $(el).text().toUpperCase();
                const cols = $(el).find('td');
                if (cols.length >= 3) {
                    const p1 = formatPrice($(cols[1]).text().trim());
                    const p2 = formatPrice($(cols[2]).text().trim());
                    if (rowText.includes('RON 95-III')) { v1.p95 = p1; v2.p95 = p2; }
                    else if (rowText.includes('0,001S-V')) { v1.do001 = p1; v2.do001 = p2; }
                    else if (rowText.includes('0,05S-II')) { v1.do05 = p1; v2.do05 = p2; }
                }
            });
            console.log("✅ Web OK");
        } catch (e) { console.log("⚠️ Web lỗi: " + e.message); }

        // 2. GỌI GOOGLE API V4
        try {
            const sheets = google.sheets({ version: 'v4', auth: API_KEY });
            const response = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: RANGE });
            const rows = response.data.values;
            
            if (rows && rows.length > 0) {
                rows.forEach(row => {
                    const name = row[0] ? row[0].toUpperCase().trim() : "";
                    const price = formatPrice(row[1]);

                    // Logic phân loại giá
                    if (!name.includes('V1') && !name.includes('V2')) {
                        if (name.includes('95')) v3.p95 = price;
                        if (name.includes('0,001') || name.includes('0.001')) v3.do001 = price;
                        if (name.includes('0,05') || name.includes('0.05')) v3.do05 = price;
                    } else if (name.includes('V1')) {
                        if (v1.p95 === "0" && name.includes('95')) v1.p95 = price;
                        if (v1.do001 === "0" && name.includes('0,001')) v1.do001 = price;
                        if (v1.do05 === "0" && name.includes('0,05')) v1.do05 = price;
                    } else if (name.includes('V2')) {
                        if (v2.p95 === "0" && name.includes('95')) v2.p95 = price;
                        if (v2.do001 === "0" && name.includes('0,001')) v2.do001 = price;
                        if (v2.do05 === "0" && name.includes('0,05')) v2.do05 = price;
                    }
                });
                console.log("✅ Sheet API OK");
            }
        } catch (e) { console.log("❌ Lỗi Sheet: " + e.message); }

        // 3. TẠO HTML
        const draw = (p, label) => {
            const fp = { p95: p.p95 === "0" ? "00.000" : p.p95, do001: p.do001 === "0" ? "00.000" : p.do001, do05: p.do05 === "0" ? "00.000" : p.do05 };
            return `<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{margin:0;background:transparent;color:#FFD700;font-family:"Arial Narrow",Arial;font-size:20px;font-weight:bold;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100vh;text-shadow:1px 1px 2px #000;}.l{color:#FFFFFF;margin-right:10px;}.v{color:#00FF00;margin-left:5px;}.s{color:#FFFFFF;opacity:0.6;margin:0 15px;}</style></head><body><div><span class="l">${label}:</span>RON 95-III: <span class="v">${fp.p95}</span><span class="s">|</span>DO 0,001S-V: <span class="v">${fp.do001}</span><span class="s">|</span>DO 0,05S-II: <span class="v">${fp.do05}</span></div></body></html>`;
        };

        fs.writeFileSync('giaxang_v1.html', draw(v1, "VÙNG 1"));
        fs.writeFileSync('giaxang_v2.html', draw(v2, "VÙNG 2"));
        fs.writeFileSync('giaxang_v3.html', draw(v3, "BẮC NINH"));
        console.log("🚀 HOÀN TẤT!");
    } catch (err) { console.log("Lỗi hệ thống: " + err.message); }
}

updatePrice();
