const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("🚀 Đang quét giá Petrolimex (Bản tự động co giãn)...");
    await page.goto('https://www.petrolimex.com.vn/index.html', { waitUntil: 'domcontentloaded' });
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
            const matches = lines[j].match(/(\d{2}\.\d{3})/g); 
            if (matches && matches.length >= 2) return { v1: matches[0], v2: matches[1] };
            if (matches && matches.length === 1) {
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

    const v1 = { p95: p95.v1, do001: do001.v1, do05: do05.v1 };

    // HÀM TẠO HTML TỰ CO GIÃN THEO KHUNG HÌNH (VIEWPORT)
    const createHTML = (dataV) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='utf-8'>
        <style>
            html, body { 
                margin: 0; padding: 0; width: 100%; height: 100%; 
                background: transparent; overflow: hidden; 
            }
            .container { 
                width: 100vw; 
                height: 100vh; 
                display: flex; 
                align-items: center; 
                justify-content: space-around; 
                box-sizing: border-box;
                padding: 0 2%;
            }
            .item {
                display: flex;
                align-items: center;
                /* Font size tính theo chiều cao của ô (vh) để không bao giờ mất dòng */
                font-size: 65vh; 
                font-family: "Arial Narrow", Arial, sans-serif;
                font-weight: bold;
                white-space: nowrap;
                text-shadow: 1px 1px 2px #000;
            }
            .product { color: #FFD700; }
            .price { color: #00FF00; margin-left: 2px; }
            .sep { color: #FFFFFF; font-size: 50vh; opacity: 0.8; margin: 0 1vw; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="item">
                <span class="product">95-III:</span>
                <span class="price">${dataV.p95}</span>
            </div>
            <span class="sep">|</span>
            <div class="item">
                <span class="product">DO-V:</span>
                <span class="price">${dataV.do001}</span>
            </div>
            <span class="sep">|</span>
            <div class="item">
                <span class="product">DO-II:</span>
                <span class="price">${dataV.do05}</span>
            </div>
        </div>
    </body>
    </html>`;

    // Ghi ra file duy nhất, Giang dùng link này cho mọi ô Web Widget
    fs.writeFileSync('giaxang_auto.html', createHTML(v1));

    console.log("✅ Đã tạo xong bản HTML tự động co giãn theo kích thước ô!");
  } catch (error) { console.error(error); } finally { await browser.close(); }
})();
