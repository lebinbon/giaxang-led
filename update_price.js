const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function updatePrice() {
    try {
        console.log("🚀 Đang lấy dữ liệu từ Webgia (Phương thức cào thô)...");

        // Gửi yêu cầu lấy mã nguồn trang Webgia
        const { data } = await axios.get('https://webgia.com/gia-xang-dau/petrolimex/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            },
            timeout: 15000
        });

        const $ = cheerio.load(data);
        const prices = { p95: "00.000", do001: "00.000", do05: "00.000" };

        // Quét qua các hàng (tr) để tìm giá Vùng 1 (cột thứ 2)
        $('tr').each((index, element) => {
            const name = $(element).find('td').eq(0).text().toUpperCase();
            const v1 = $(element).find('td').eq(1).text().trim();

            if (name.includes('95-III')) prices.p95 = v1;
            if (name.includes('0,001S-V')) prices.do001 = v1;
            if (name.includes('0,05S-II')) prices.do05 = v1;
        });

        console.log("📊 Giá Vùng 1 thu được:", prices);

        // --- PHẦN HTML CHO BẢNG LED ---
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body { 
            margin: 0; background: transparent; color: #FFD700; 
            font-family: "Arial Narrow", Arial, sans-serif; 
            font-size: 20px; font-weight: bold; overflow: hidden; 
            white-space: nowrap; text-shadow: 1px 1px 2px #000;
        }
        .container { 
            width: 100%; height: 100vh; display: flex; 
            align-items: center; justify-content: center; 
            padding: 0 5px; box-sizing: border-box; 
        }
        .label { color: #FFFFFF; margin-right: 10px; flex-shrink: 0; } 
        .item { display: flex; align-items: center; }
        .product-name { color: #FFD700; }
        .price-value { color: #00FF00; margin-left: 5px; }
        .separator { color: #FFFFFF; opacity: 0.6; margin: 0 8px; }
    </style>
</head>
<body>
    <div class="container">
        <span class="label">GIÁ BÁN LẺ (Đ/L):</span>
        <div class="item">
            <span class="product-name">XĂNG RON 95-III</span>
            <span class="price-value">${prices.p95}</span>
        </div>
        <span class="separator">|</span>
        <div class="item">
            <span class="product-name">DẦU DO 0,001S-V</span>
            <span class="price-value">${prices.do001}</span>
        </div>
        <span class="separator">|</span>
        <div class="item">
            <span class="product-name">DẦU DO 0,05S-II</span>
            <span class="price-value">${prices.do05}</span>
        </div>
    </div>
</body>
</html>`;

        // Ghi file HTML và JSON
        fs.writeFileSync('giaxang_v1.html', htmlContent);
        fs.writeFileSync('price.json', JSON.stringify({ ...prices, update: new Date().toLocaleString() }, null, 2));

        console.log("✅ Đã cập nhật xong file giaxang_v1.html và price.json");

    } catch (error) {
        console.error("❌ Lỗi cào dữ liệu:", error.message);
    }
}

updatePrice();
