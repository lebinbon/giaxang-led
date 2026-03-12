const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    console.log("🚀 Đang truy cập Petrolimex để lấy giá Vùng 1 & Vùng 2...");
    await page.goto('https://www.petrolimex.com.vn/index.html', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });

    // Chờ 5 giây để đảm bảo menu tải xong
    await page.waitForTimeout(5000);

    // Di chuột vào phần bảng giá
    const menu = page.getByText('Giá bán lẻ xăng dầu').first();
    await menu.hover();
    await page.waitForTimeout(5000); 

    const content = await page.innerText('body');
    const lines = content.toUpperCase().split('\n');

    // Hàm lấy giá trị của cả 2 vùng dựa trên từ khóa sản phẩm
    function findPrices(keyword) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(keyword)) {
          let foundV1 = "00.000";
          let foundV2 = "00.000";
          
          // Quét dòng hiện tại và 4 dòng kế tiếp để tìm giá
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

    // Trích xuất dữ liệu
    const p95 = findPrices("RON 95-III");
    const e5 = findPrices("E5 RON 92-II");
    const do001 = findPrices("DO 0,001S-V");
    const do05 = findPrices("DO 0,05S-II");

    // Hàm tạo HTML Template chuẩn kích thước 1872x82
    const createHTML = (vungName, dataV) => `
    <!DOCTYPE html>
    <html>
    <head><meta charset='utf-8'><style>
        body { 
            margin:0; background: transparent; color:#FFD700; 
            font-family: "Arial Narrow", Arial, sans-serif; 
            font-size: 25px; font-weight: bold; overflow: hidden; 
            white-space: nowrap; text-shadow: 2px 2px 3px #000;
            letter-spacing: -0.5px;
        }
        .container { 
            width: 1872px; height: 82px; display: flex; 
            align-items: center; justify-content: space-between; 
            padding: 0 10px; box-sizing: border-box; 
        }
        .label { color: #FFFFFF; }
        .separator { color: #FFFFFF; margin: 0 5px; }
        .price-value { color: #00FF00; }
    </style></head>
    <body>
        <div class="container">
            <span class="label">GIÁ BÁN LẺ ${vungName} (Đ/L):</span>
            <span>XĂNG RON 95-III: <span class="price-value">${dataV.p95}</span></span>
            <span class="separator">|</span>
            <span>XĂNG E5 RON 92-II: <span class="price-value">${dataV.e5}</span></span>
            <span class="separator">|</span>
            <span>DẦU DO 0,001S-V: <span class="price-value">${dataV.do001}</span></span>
            <span class="separator">|</span>
            <span>DẦU DO 0,05S-II: <span class="price-value">${dataV.do05}</span></span>
        </div>
    </body>
    </html>`;

    // Ghi file cho Vùng 1
    const dataV1 = { p95: p95.v1, e5: e5.v1, do001: do001.v1, do05: do05.v1 };
    fs.writeFileSync('giaxang_v1.html', createHTML('VÙNG 1', dataV1));
    
    // Ghi file cho Vùng 2
    const dataV2 = { p95: p95.v2, e5: e5.v2, do001: do001.v2, do05: do05.v2 };
    fs.writeFileSync('giaxang_v2.html', createHTML('VÙNG 2', dataV2));

    // Lưu file JSON để kiểm tra log
    fs.writeFileSync('price.json', JSON.stringify({ v1: dataV1, v2: dataV2, update: new Date().toLocaleString() }, null, 2));

    console.log("✅ Cập nhật thành công cả 2 vùng!");
    console.log("Vùng 1:", dataV1);
    console.log("Vùng 2:", dataV2);

  } catch (error) {
    console.error("❌ Lỗi thực thi:", error.message);
  } finally {
    await browser.close();
  }
})();
