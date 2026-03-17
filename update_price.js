const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    console.log("🚀 Đang quét giá Vùng 1 (10 phút/lần)...");
    
    // Chặn tải rác để chạy nhanh
    await page.route('**/*.{png,jpg,jpeg,css,woff}', route => route.abort());

    await page.goto('https://webgia.com/gia-xang-dau/petrolimex/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });

    await page.waitForTimeout(3000);

    const prices = await page.evaluate(() => {
      const results = { p95: "00.000", do001: "00.000", do05: "00.000" };
      const rows = Array.from(document.querySelectorAll('tr'));

      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length >= 2) {
          const name = cells[0].innerText.toUpperCase();
          const v1 = cells[1].innerText.trim();

          if (name.includes('95-III')) results.p95 = v1;
          if (name.includes('0,001S-V')) results.do001 = v1;
          if (name.includes('0,05S-II')) results.do05 = v1;
        }
      });
      return results;
    });

    // PHẦN HTML GIAO DIỆN ĐẦY ĐỦ CỦA GIANG
    const htmlContent = `
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

    fs.writeFileSync('giaxang_v1.html', htmlContent);
    fs.writeFileSync('price.json', JSON.stringify({ ...prices, last_sync: new Date().toLocaleString() }, null, 2));

    console.log("✅ Đã cập nhật xong giao diện đầy đủ!");

  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  } finally {
    await browser.close();
  }
})();
