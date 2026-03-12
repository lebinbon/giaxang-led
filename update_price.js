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
            color:#FFD700; /* Màu vàng đặc trưng Petrolimex */
            font-family: "Arial Black", Gadget, sans-serif; /* Dùng font dày để đổ bóng đẹp hơn */
            font-size: 30px; 
            font-weight: bold; 
            overflow: hidden; 
            white-space: nowrap;
            /* Đổ bóng 4 hướng giúp chữ cực kỳ sắc nét trên mọi loại nền video/ảnh */
            text-shadow: 
                2px 2px 0px #000, 
                -2px -2px 0px #000, 
                2px -2px 0px #000, 
                -2px 2px 0px #000,
                4px 4px 8px rgba(0,0,0,1); 
        }
        .container { 
            width: 1872px; 
            height: 82px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            padding: 0 20px; 
            box-sizing: border-box; 
        }
        .label { color: #FFFFFF; margin-right: 20px; } /* Chữ "GIÁ BÁN LẺ" màu trắng */
        .separator { color: #FFFFFF; margin: 0 30px; font-weight: normal; } /* Dấu gạch đứng màu trắng */
        .price-value { color: #00FF00; } /* Số tiền màu xanh lá cho nổi bật */
    </style></head>
    <body>
        <div class="container">
            <span class="label">GIÁ BÁN LẺ (Đ/L):</span>
            
            <span>XĂNG RON 95 MỨC 3: <span class="price-value">${data.RON95_III}</span></span>
            <span class="separator">|</span>
            
            <span>XĂNG E5 RON 92 MỨC 2: <span class="price-value">${data.E5}</span></span>
            <span class="separator">|</span>
            
            <span>DẦU DO 0,001 MỨC 5: <span class="price-value">${data.DO_001}</span></span>
            <span class="separator">|</span>
            
            <span>DẦU DO 0,05S MỨC 2: <span class="price-value">${data.DO_05}</span></span>
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
