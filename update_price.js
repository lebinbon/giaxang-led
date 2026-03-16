const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("🚀 Đang truy cập Petajico Hà Nội...");
    await page.goto('https://petajicohanoi.petrolimex.com.vn/', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });

    // Chờ thêm một chút cho bảng giá hiện ra hoàn toàn
    await page.waitForTimeout(3000);

    // Lấy tất cả các ô trong bảng giá
    const cells = await page.$$eval('td', tds => tds.map(td => td.innerText.trim().toUpperCase()));

    function findPrice(keyword) {
      for (let i = 0; i < cells.length; i++) {
        if (cells[i].includes(keyword)) {
          // Giá thường nằm ở ô ngay sau hoặc ô kế tiếp có chứa số
          for (let j = i + 1; j < i + 5; j++) {
            if (cells[j] && /^\d{2}\.\d{3}$/.test(cells[j])) {
              return cells[j];
            }
          }
        }
      }
      return "00.000";
    }

    const p95 = findPrice("RON 95-III");
    const do001 = findPrice("DO 0,001S-V");
    const do05 = findPrice("DO 0,05S-II");

    console.log(`📊 Kết quả quét: 95: ${p95}, DO-V: ${do001}, DO-II: ${do05}`);

    if (p95 === "00.000") {
        console.log("⚠️ Cảnh báo: Có thể cấu trúc web thay đổi, đang dùng giá mặc định.");
    }

    const createHTML = (data) => `
    <!DOCTYPE html>
    <html>
    <head><meta charset='utf-8'><style>
        body { 
            margin:0; background: transparent; color:#FFD700; 
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
    </style></head>
    <body>
        <div class="container">
            <span class="label">GIÁ BÁN LẺ (Đ/L):</span>
            <div class="item">
                <span class="product-name">XĂNG RON 95-III</span>
                <span class="price-value">${data.p95}</span>
            </div>
            <span class="separator">|</span>
            <div class="item">
                <span class="product-name">DẦU DO 0,001S-V</span>
                <span class="price-value">${data.do001}</span>
            </div>
            <span class="separator">|</span>
            <div class="item">
                <span class="product-name">DẦU DO 0,05S-II</span>
                <span class="price-value">${data.do05}</span>
            </div>
        </div>
    </body>
    </html>`;

    const priceData = { p95, do001, do05 };
    fs.writeFileSync('giaxang_v1.html', createHTML(priceData));
    fs.writeFileSync('price.json', JSON.stringify({ ...priceData, last_update: new Date().toLocaleString() }, null, 2));

    console.log("✅ Đã cập nhật xong!");

  } catch (error) {
    console.error("❌ Lỗi thực thi:", error.message);
  } finally {
    await browser.close();
  }
})();
