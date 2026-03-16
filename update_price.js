const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("🚀 Đang lấy giá từ Petajico Hà Nội (Nguồn trực tiếp)...");
    
    // Truy cập thẳng trang Petajico Hà Nội
    await page.goto('https://petajicohanoi.petrolimex.com.vn/', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });

    // Đợi 2 giây để chắc chắn bảng giá đã render
    await page.waitForTimeout(2000);

    // Lấy toàn bộ văn bản trên trang
    const content = await page.innerText('body');
    const lines = content.toUpperCase().split('\n');

    // Hàm tìm giá (Ưu tiên lấy số đầu tiên tìm thấy sau từ khóa - thường là Vùng 1)
    function findPrices(keyword) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(keyword)) {
          // Quét trong 5 dòng tiếp theo để tìm con số định dạng XX.XXX
          for (let j = i; j < i + 5; j++) {
            if (j >= lines.length) break;
            const matches = lines[j].match(/(\d{2}\.\d{3})/g); 
            if (matches && matches.length >= 1) {
              // Trạm Petajico Hà Nội thường dùng giá Vùng 1
              return matches[0]; 
            }
          }
        }
      }
      return "00.000";
    }

    // Trích xuất dữ liệu từ Petajico
    const p95 = findPrices("RON 95-III");
    const do001 = findPrices("DO 0,001S-V");
    const do05 = findPrices("DO 0,05S-II");

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

    console.log("✅ Đã cập nhật xong từ nguồn Petajico Hà Nội!");
    console.log("Giá mới:", priceData);

  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  } finally {
    await browser.close();
  }
})();
