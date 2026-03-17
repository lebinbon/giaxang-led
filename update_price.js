const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    console.log("🚀 Đang mở link Petrolimex trên Webgia...");
    await page.goto('https://webgia.com/gia-xang-dau/petrolimex/', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });

    // Chờ 5 giây để bảng giá hiện ra hẳn (quan trọng vì máy chủ GitHub đôi khi lag)
    await page.waitForTimeout(5000);

    const prices = await page.evaluate(() => {
      const results = { p95: "00.000", do001: "00.000", do05: "00.000" };
      
      // Lấy tất cả các hàng <tr> trong bảng
      const rows = Array.from(document.querySelectorAll('tr'));

      rows.forEach(row => {
        const text = row.innerText.toUpperCase();
        const cells = Array.from(row.querySelectorAll('td'));
        
        // Nếu hàng có ít nhất 2 cột
        if (cells.length >= 2) {
          const v1 = cells[1].innerText.trim();
          
          // Kiểm tra nếu giá trị ở cột Vùng 1 là định dạng số (có dấu chấm)
          if (/\d{2}\.\d{3}/.test(v1)) {
            if (text.includes('RON 95-III')) results.p95 = v1;
            if (text.includes('0,001S-V')) results.do001 = v1;
            if (text.includes('0,05S-II')) results.do05 = v1;
          }
        }
      });
      return results;
    });

    console.log("📊 Kết quả thực tế:", prices);

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

    console.log("✅ Cập nhật file thành công!");

  } catch (error) {
    console.error("❌ Lỗi quét Webgia:", error.message);
  } finally {
    await browser.close();
  }
})();
