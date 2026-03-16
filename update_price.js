const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  // Giả lập trình duyệt giống hệt người dùng thật tại VN
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh'
  });
  const page = await context.newPage();

  try {
    console.log("🚀 Đang mở Webgia (Bản tối ưu Selector)...");
    
    // Truy cập và đợi mạng ổn định
    await page.goto('https://webgia.com/gia-xang-dau/petrolimex/', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });

    // Cuộn trang xuống một chút để kích hoạt load dữ liệu nếu có lazy-load
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(5000);

    const prices = await page.evaluate(() => {
      const results = { p95: "00.000", do001: "00.000", do05: "00.000" };
      
      // Tìm tất cả các bảng có trên trang
      const tables = document.querySelectorAll('table');
      
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            const itemName = cells[0].innerText.toUpperCase();
            const priceV1 = cells[1].innerText.trim();

            // Chỉ lấy nếu giá tiền có chứa dấu chấm (định dạng XX.XXX)
            if (/\d{2}\.\d{3}/.test(priceV1)) {
              if (itemName.includes('RON 95-III')) results.p95 = priceV1;
              if (itemName.includes('0,001S-V')) results.do001 = priceV1;
              if (itemName.includes('0,05S-II')) results.do05 = priceV1;
            }
          }
        });
      });
      return results;
    });

    console.log("📊 Kết quả bóc tách:", prices);

    // Tạo nội dung HTML (Sửa lại biến để đảm bảo giá trị được truyền vào đúng)
    const finalHTML = `
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

    fs.writeFileSync('giaxang_v1.html', finalHTML);
    fs.writeFileSync('price.json', JSON.stringify({ ...prices, time: new Date().toLocaleString() }, null, 2));

    console.log("✅ Cập nhật thành công!");

  } catch (error) {
    console.error("❌ Lỗi Scraper:", error.message);
  } finally {
    await browser.close();
  }
})();
