const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    console.log("🚀 Đang quét giá Petrolimex (Bản siêu rút gọn)...");
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
            font-size: 20px; /* Hạ xuống 20px để tránh mất chữ */
            font-weight: bold; overflow: hidden; 
            white-space: nowrap; text-shadow: 1px 1px 2px #000;
        }
        .container { 
            width: 100%; height: 100vh; display: flex; 
            align-items: center; justify-content: flex-start; /* Dồn về bên trái */
            padding: 0 5px; box-sizing: border-box; 
        }
        .label { color: #FFFFFF; margin-right: 5px; } /* Tiêu đề sát hơn */
        .separator { color: #FFFFFF; opacity: 0.5; margin: 0 3px; } /* Gạch đứng cực sát */
        .price-value { color: #00FF00; }
        .item { margin: 0 2px; } /* Giảm khoảng cách giữa các khối mặt hàng */
    </style></head>
    <body>
        <div class="container">
            <span class="label">GIÁ BÁN:</span>
            
            <span class="item">95-III:<span class="price-value">${dataV.p95}</span></span>
            <span class="separator">|</span>
            
            <span class="item">DV:<span class="price-value">${dataV.do001}</span></span>
            <span class="separator">|</span>
            
            <span class="item">DII:<span class="price-value">${dataV.do05}</span></span>
        </div>
    </body>
    </html>`;

    fs.writeFileSync('giaxang_v1.html', createHTML({ p95: p95.v1, do001: do001.v1, do05: do05.v1 }));
    fs.writeFileSync('giaxang_v2.html', createHTML({ p95: p95.v2, do001: do001.v2, do05: do05.v2 }));

    console.log("✅ Đã cập nhật xong bản ép gọn!");
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  } finally {
    await browser.close();
  }
})();
