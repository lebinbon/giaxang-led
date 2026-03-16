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

    // Chờ 5 giây để bảng giá tải xong hoàn toàn
    await page.waitForTimeout(5000);

    // Lấy toàn bộ text thô trên trang để quét cho chắc chắn
    const fullText = await page.evaluate(() => document.body.innerText.toUpperCase());
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    function getPrice(keyword) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(keyword)) {
          // Sau khi thấy tên sản phẩm, quét 3 dòng tiếp theo để tìm con số giá tiền
          for (let j = i; j < i + 4; j++) {
            const matches = lines[j].match(/(\d{2}\.\d{3})/);
            if (matches) return matches[1];
          }
        }
      }
      return "00.000";
    }

    // Lấy giá theo đúng tên trong ảnh bạn gửi
    const p95 = getPrice("RON 95-III");
    const do001 = getPrice("DO 0,001S-V");
    const do05 = getPrice("DO 0,05S-II");

    console.log(`📊 Kết quả: 95: ${p95}, DO-V: ${do001}, DO-II: ${do05}`);

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
    fs.writeFileSync('price.json', JSON.stringify({ ...priceData, update: new Date().toLocaleString() }, null, 2));

    console.log("✅ Cập nhật hoàn tất!");

  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  } finally {
    await browser.close();
  }
})();
