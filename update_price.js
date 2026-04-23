const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');

// Hàm format giá: 25570 -> 25.570
function formatPrice(price) {
    if (!price || price === "" || price === "0" || price === "00.000") return "0";
    let num = price.toString().replace(/\D/g, '');
    if (num.length <= 3) return num;
    return num.slice(0, -3) + '.' + num.slice(-3);
}

async function updatePrice() {
    try {
        console.log("🚀 Khởi động logic: Ưu tiên AppSheet -> Backup Webgia...");

        let v1 = { p95: "0", do001: "0", do05: "0" };
        let v2 = { p95: "0", do001: "0", do05: "0" };
        let v3 = { p95: "0", do001: "0", do05: "0" };

        // --- BƯỚC 1: LẤY DỮ LIỆU TỪ APPSHEET CỦA GIANG TRƯỚC ---
        try {
            const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRsyRFDGG8UiJcYfGgx24Du24cFSiwexQ1BoYpuVaPW4QKfnZ3o5-SMCTp5tKsRGxvlPRih5gY90Pki/pub?gid=0&single=true&output=csv';
            const resCsv = await axios.get(csvUrl + '&t=' + Date.now());
            const rows = resCsv.data.split('\n');

            rows.forEach(row => {
                const cells = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if (cells.length >= 2) {
                    const name = cells[0].toUpperCase().trim();
                    const price = formatPrice(cells[1].replace(/"/g, '').trim());
                    if (price === "0") return; // Bỏ qua nếu ô đó trống

                    if (name.includes('V1')) {
                        if (name.includes('95')) v1.p95 = price;
                        if (name.includes('0,001')) v1.do001 = price;
                        if (name.includes('0,05')) v1.do05 = price;
                    } else if (name.includes('V2')) {
                        if (name.includes('95')) v2.p95 = price;
                        if (name.includes('0,001')) v2.do001 = price;
                        if (name.includes('0,05')) v2.do05 = price;
                    } else { // Vùng 3 Bắc Ninh
                        if (name.includes('95')) v3.p95 = price;
                        if (name.includes('0,001')) v3.do001 = price;
                        if (name.includes('0,05')) v3.do05 = price;
                    }
                }
            });
            console.log("✅ Đã kiểm tra xong AppSheet.");
        } catch (e) { console.log("Lỗi đọc Sheets"); }

        // --- BƯỚC 2: KIỂM TRA WEB GIA - NẾU Ô NÀO CÒN TRỐNG THÌ LẤY TỪ WEB ---
        if (v1.p95 === "0" || v2.p95 === "0") {
            try {
                const resWeb = await axios.get('https://webgia.com/gia-xang-dau/petrolimex/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const $ = cheerio.load(resWeb.data);
                $('tr').each((i, el) => {
                    const row = $(el).text().toUpperCase();
                    const m = $(el).text().match(/(\d{2}\.\d{3})/g);
                    if (m && m.length >= 2) {
                        // Chỉ lấy từ web nếu trong AppSheet Giang đang để trống (bằng "0")
                        if (row.includes('95-III')) { 
                            if (v1.p95 === "0") v1.p95 = m[0]; 
                            if (v2.p95 === "0") v2.p95 = m[1]; 
                        }
                        if (row.includes('0,001S-V')) { 
                            if (v1.do001 === "0") v1.do001 = m[0]; 
                            if (v2.do001 === "0") v2.do001 = m[1]; 
                        }
                        if (row.includes('0,05S-II')) { 
                            if (v1.do05 === "0") v1.do05 = m[0]; 
                            if (v2.do05 === "0") v2.do05 = m[1]; 
                        }
                    }
                });
                console.log("✅ Đã lấy dữ liệu dự phòng từ Webgia.");
            } catch (e) { console.log("Lỗi Webgia"); }
        }

        // --- BƯỚC 3: XUẤT FILE HTML (Dùng hàm mặc định "00.000" nếu cả 2 đều trống) ---
        const finalPrice = (p) => ({
            p95: p.p95 === "0" ? "00.000" : p.p95,
            do001: p.do001 === "0" ? "00.000" : p.do001,
            do05: p.do05 === "0" ? "00.000" : p.do05
        });

      const draw = (p) => {
            const fp = finalPrice(p);
            return `<!DOCTYPE html><html><head><meta charset='utf-8'><style>
                body {
                    margin: 0;
                    background: transparent;
                    color: #FFD700;
                    font-family: "Arial Narrow", Arial, sans-serif;
                    font-size: 24px; /* Cỡ chữ chuẩn cho màn 1040 */
                    font-weight: bold;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    text-shadow: 1px 1px 2px #000;
                }
                .container {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    white-space: nowrap; /* Chống xuống dòng tuyệt đối */
                    gap: 10px;
                }
                .l { color: #FFFFFF; }
                .v { color: #00FF00; margin-left: 5px; }
                .s { color: #FFFFFF; opacity: 0.6; }

                /* TỰ THÍCH NGHI CHO MÀN HÌNH NHỎ (640x240) */
                @media (max-width: 700px) {
                    body {
                        font-size: 14px; /* Co nhỏ chữ lại để vừa 1 dòng trên màn 640 */
                    }
                    .container {
                        gap: 5px; /* Thu hẹp khoảng cách giữa các phần tử */
                    }
                    .s { margin: 0 2px; } /* Thu nhỏ khoảng cách dấu gạch đứng */
                }
            </style></head>
            <body>
                <div class="container">
                    <span class="l">GIÁ BÁN LẺ (Đ/L):</span>
                    <span>XĂNG RON 95-III:<span class="v">${fp.p95}</span></span>
                    <span class="s">|</span>
                    <span>DẦU DO 0,001S-V:<span class="v">${fp.do001}</span></span>
                    <span class="s">|</span>
                    <span>DẦU DO 0,05S-II:<span class="v">${fp.do05}</span></span>
                </div>
            </body></html>`;
        };

        fs.writeFileSync('giaxang_v1.html', draw(v1));
        fs.writeFileSync('giaxang_v2.html', draw(v2));
        fs.writeFileSync('giaxang_v3.html', draw(v3));
        
        console.log("🚀 HOÀN TẤT CẬP NHẬT!");
    } catch (e) { console.error(e.message); }
}
updatePrice();
