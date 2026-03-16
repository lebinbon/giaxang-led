const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("🚀 Đang mở Webgia.com...");
    await page.goto('https://webgia.com/gia-xang-dau/petrolimex/', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });

    await page.waitForTimeout(3000);

    const prices = await page.evaluate(() => {
      const results = { p95: "00.000", do001: "00.000", do05: "00.000" };
      
      // Tìm tất cả các bảng trên trang
      const tables = Array.from(document.querySelectorAll('table'));
      
      // Chỉ tìm bảng nào có chứa chữ "Sản phẩm" và "Vùng 1"
      const priceTable = tables.find(t => t.innerText.includes('Sản phẩm') && t.innerText.includes('Vùng 1'));

      if (priceTable) {
        const rows = Array.from(priceTable.querySelectorAll('tr'));
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length >= 2) {
            const name = cells[0].innerText.toUpperCase();
            const valV1 = cells[1].innerText.trim();

            if (name.includes('RON 95-III')) results.p95 = valV1;
            if (name.includes('DO 0,001S-V')) results.do001 = valV1;
            if (name.includes('DO 0,05S-II') || name.includes('DO 0.05S')) results.do05 = valV1;
          }
        });
      }
      return results;
    });

    console.log("📊 Giá lấy được từ bảng:", prices);

    const createHTML = (d) => `
    <!DOCTYPE html><html><head><meta charset='utf-8'><style>
        body { margin:0; background:transparent; color:#FFD700; font-family:"Arial Narrow",Arial; font-size:20px; font-weight:bold; overflow:hidden; white-space:nowrap; text-shadow:1px 1px 2px #000; }
        .container { width:100%; height:100vh; display:flex; align-items:center; justify-content:center; padding:0 5px; box-sizing:border-box; }
        .label { color:#FFFFFF; margin-right:10px; }
        .item { display:flex; align-items:center; }
        .price-value { color:#00FF00; margin-left:5px; }
        .separator { color:#FFFFFF; opacity:0.6; margin:0 8px; }
    </style></head><body><div class="container">
        <span class="label">GIÁ BÁN LẺ (Đ/L):</span>
        <div class="item"><span>XĂNG RON 95-III</span><span class="price-value">${prices.p95}</span></div>
        <span class="separator">|</span>
        <div class="item"><span>DẦU DO 0,001S-V</span><span class="price-value">${prices.do001}</span></div>
        <span class="separator">|</span>
        <div class="item"><span>DẦU DO 0,05S-II</span><span class="price-value">${prices.do05}</span></div>
    </div></body></html>`;

    fs.writeFileSync('giaxang_v1.html', createHTML({}));
    fs.writeFileSync('price.json', JSON.stringify({ ...prices, update: new Date().toLocaleString() }, null, 2));

    console.log("✅ Xong! Kiểm tra file price.json để thấy kết quả.");

  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  } finally {
    await browser.close();
  }
})();
