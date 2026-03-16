const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    console.log("🚀 Đang lấy giá từ Báo Mới (Tiện ích giá xăng dầu)...");
    
    // Truy cập link tiện ích của Báo Mới
    await page.goto('https://baomoi.com/tien-ich-gia-xang-dau.epi', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });

    // Đợi 3 giây để các con số render xong
    await page.waitForTimeout(3000);

    // Lấy dữ liệu bằng cách quét các hàng trong bảng tiện ích
    const priceData = await page.evaluate(() => {
      const results = {};
      // Tìm tất cả các hàng chứa dữ liệu xăng dầu
      const rows = Array.from(document.querySelectorAll('tr, .row')); 
      
      rows.forEach(row => {
        const text = row.innerText.toUpperCase();
        // Tìm các con số có định dạng XX.XXX
        const matches = text.match(/(\d{2}\.\d{3})/g);
        
        if (matches) {
          // Báo Mới thường để giá Vùng 1 là con số đầu tiên tìm thấy
          if (text.includes('RON 95-III')) results.p95 = matches[0];
          if (text.includes('0,001S-V')) results.do001 = matches[0];
          if (text.includes('0,05S-II')) results.do05 = matches[0];
        }
      });
      return results;
    });

    // Gán giá trị, nếu không tìm thấy thì để 00.000 để dễ nhận biết lỗi
    const p95 = priceData.p95 || "00.000";
    const do001 = priceData.do001 || "00.000";
    const do05 = priceData.do05 || "00.000";

    console.log(`📊 Kết quả Báo Mới: 95: ${p95}, DO-V: ${do001}, DO-II: ${do05}`);

    // Tạo file HTML hiển thị cho LED
    const createHTML = (d) => `
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
                <span class="price-value">${p95}</span>
            </div>
            <span class="separator">|</span>
            <div class="item">
                <span class="product-name">DẦU DO 0,001S-V</span>
                <span class="price-value">${do001}</span>
            </div>
            <span class="separator">|</span>
            <div class="item">
                <span class="product-name">DẦU DO 0,05S-II</span>
                <span class="price-value">${do05}</span>
            </div>
        </div>
    </body>
    </html>`;

    // Xuất file cho LED và file JSON lưu lịch sử
    fs.writeFileSync('giaxang_v1.html', createHTML({}));
    fs.writeFileSync('price.json', JSON.stringify({ p95, do001, do05, last_update: new Date().toLocaleString() }, null, 2));

    console.log("✅ Đã cập nhật xong từ Báo Mới!");

  } catch (error) {
    console.error("❌ Lỗi thực thi:", error.message);
  } finally {
    await browser.close();
  }
})();
