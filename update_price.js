const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  // Thêm các tham số để tránh bị nhận diện là Bot
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    console.log("🚀 Đang truy cập Petrolimex...");
    // Sửa waitUntil thành domcontentloaded và tăng timeout lên 60s
    await page.goto('https://www.petrolimex.com.vn/index.html', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });

    // Chờ thêm một chút để đảm bảo các thẻ menu hiện ra
    await page.waitForTimeout(5000);

    console.log("🖱️ Đang di chuột vào bảng giá...");
    const menu = page.getByText('Giá bán lẻ xăng dầu').first();
    await menu.hover();
    await page.waitForTimeout(5000); // Đợi bảng giá bung ra

    const content = await page.innerText('body');
    const lines = content.toUpperCase().split('\n');

    const data = {
      RON95_III: "00.000", E5: "00.000", DO_001: "00.000", DO_05: "00.000"
    };

    function findPrice(keyword) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(keyword)) {
          for (let j = i; j < i + 5; j++) {
            const match = lines[j].match(/(\d{2}\.\d{3})/);
            if (match) return match[1];
          }
        }
      }
      return "00.000";
    }

    data.RON95_III = findPrice("RON 95-III");
    data.E5 = findPrice("E5 RON 92-II");
    data.DO_001 = findPrice("DO 0,001S-V");
    data.DO_05 = findPrice("DO 0,05S-II");

const createHTML = (vung) => `
    <!DOCTYPE html>
    <html>
    <head><meta charset='utf-8'><style>
        body { 
            margin:0; 
            background: transparent; 
            color:#FFD700; 
            font-family: "Arial Narrow", Arial, sans-serif; /* Dùng font hẹp để tiết kiệm diện tích */
            font-size: 24px; /* Hạ từ 32px xuống 24px để vừa hàng ngang */
            font-weight: bold; 
            overflow: hidden; 
            white-space: nowrap;
            text-shadow: 1px 1px 2px #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
        }
        .container { 
            width: 1872px; 
            height: 82px; 
            display: flex; 
            align-items: center; 
            justify-content: space-between; /* Chia đều khoảng cách */
            padding: 0 15px; 
            box-sizing: border-box; 
        }
        .label { color: #FFFFFF; }
        .separator { color: #FFFFFF; margin: 0 10px; }
        .price-value { color: #00FF00; }
    </style></head>
    <body>
        <div class="container">
            <span class="label">GIÁ BÁN LẺ (Đ/L):</span>
            
            <span>RON 95-III: <span class="price-value">${data.RON95_III}</span></span>
            <span class="separator">|</span>
            
            <span>E5 RON 92-II: <span class="price-value">${data.E5}</span></span>
            <span class="separator">|</span>
            
            <span>DO 0,001S-V: <span class="price-value">${data.DO_001}</span></span>
            <span class="separator">|</span>
            
            <span>DO 0,05S-II: <span class="price-value">${data.DO_05}</span></span>
        </div>
    </body>
    </html>`;

    fs.writeFileSync('giaxang_v1.html', createHTML('VÙNG 1'));
    fs.writeFileSync('giaxang_v2.html', createHTML('VÙNG 2'));
    fs.writeFileSync('price.json', JSON.stringify(data, null, 2));

    console.log("✅ Cập nhật thành công: ", data);
  } catch (error) {
    console.error("❌ Lỗi thực thi:", error.message);
    // Nếu lỗi, ghi giá 00.000 để file không bị hỏng
  } finally {
    await browser.close();
  }
})();
