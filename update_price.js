const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    console.log("🚀 Đang quét giá Petrolimex (Chỉ lấy 3 mặt hàng)...");
    await page.goto('https://www.petrolimex.com.vn/index.html', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });

    await page.waitForTimeout(5000);

    const menu = page.getByText('Giá bán lẻ xăng dầu').first();
    await menu.hover();
    await page.waitForTimeout(5000); 

    const content = await page.innerText('body');
    const lines = content.toUpperCase().split('\n');

    function findPrices(keyword) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(keyword)) {
          let foundV1 = "00.000", foundV2 = "00.000";
          for (let j = i; j < i + 5; j++) {
            if (j >= lines.length) break;
            const matches = lines[j].match(/(\d{2}\.\d{3})/g); 
            if (matches && matches.length >= 2) {
              return { v1: matches[0], v2: matches[1] };
            } else if (matches && matches.length === 1) {
              if (foundV1 === "00.000") foundV1 = matches[0];
              else return { v1: foundV1, v2: matches[0] };
            }
          }
          return { v1: foundV1, v2: foundV2 };
        }
      }
      return { v1: "00.000", v2: "00.000" };
    }

    // CHỈ LẤY 3 MẶT HÀNG NÀY
    const p95 = findPrices("RON 95-III");
    const do001 = findPrices("DO 0,001S-V");
    const do05 = findPrices("DO 0,05S-II");

    const createHTML = (dataV) => `
    <!DOCTYPE html>
    <html>
    <head><meta charset='utf-8'><style>
        body { 
            margin:0; background: transparent; color:#FFD700; 
            font-family: "Arial Narrow", Arial, sans-serif; 
            font-size: 28px; font-weight: bold; overflow: hidden; 
            white-space: nowrap; text-shadow: 2px 2px 3px #000;
        }
        .container { 
            width: 1872px; height: 82px; display: flex; 
            align-items: center; justify-content: space-around; 
            padding: 0 40px; box-sizing: border-box; 
        }
        .label { color: #FFFFFF; }
        .separator { color: #FFFFFF; opacity: 0.7; }
        .price-value { color: #00FF00; }
    </style></head>
    <body>
        <div class="container">
            <span class="label">GIÁ BÁN LẺ (Đ/L):</span>
            
            <span>XĂNG RON 95-III: <span class="price-value">${dataV.p95}</span></span>
            <span class="separator">|</span>
            
            <span>DẦU DO 0,001S-V: <span class="price-value">${dataV.do001}</span></span>
            <span class="separator">|</span>
            
            <span>DẦU DO 0,05S-II: <span class="price-value">${dataV.do05}</span></span>
        </div>
    </body>
    </html>`;

    // Ghi file cho Vùng 1
    fs.writeFileSync('giaxang_v1.html', createHTML({ p95: p95.v1, do001: do001.v1, do05: do05.v1 }));
    
    // Ghi file cho Vùng 2
    fs.writeFileSync('giaxang_v2.html', createHTML({ p95: p95.v2, do001: do001.v2, do05: do05.v2 }));

    // Cập nhật file JSON
    fs.writeFileSync('price.json', JSON.stringify({ 
        v1: { p95: p95.v1, do001: do001.v1, do05: do05.v1 },
        v2: { p95: p95.v2, do001: do001.v2, do05: do05.v2 },
        last_update: new Date().toLocaleString() 
    }, null, 2));

    console.log("✅ Đã cập nhật xong! Chỉ còn 3 mặt hàng.");
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  } finally {
    await browser.close();
  }
})();
