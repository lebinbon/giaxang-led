const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('https://www.petrolimex.com.vn/index.html', { waitUntil: 'networkidle' });
    
    // Di chuột để hiện bảng giá
    const menu = page.getByText('Giá bán lẻ xăng dầu').first();
    await menu.hover();
    await page.waitForTimeout(3000);

    const content = await page.innerText('body');
    const lines = content.toUpperCase().split('\n');

    const data = {
      RON95_V: "00.000", RON95_III: "00.000", E5: "00.000", DO_001: "00.000", DO_05: "00.000"
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

    // Lấy giá thực tế (Vùng 1)
    data.RON95_V = findPrice("RON 95-V");
    data.RON95_III = findPrice("RON 95-III");
    data.E5 = findPrice("E5 RON 92-II");
    data.DO_001 = findPrice("DO 0,001S-V");
    data.DO_05 = findPrice("DO 0,05S-II");

    // Hàm tạo HTML Template
    const createHTML = (vung) => `
    <!DOCTYPE html>
    <html>
    <head><meta charset='utf-8'><style>
        body { margin:0; background: transparent; color:#FFD700; font-family:Arial; font-size:28px; font-weight:bold; overflow:hidden; }
        .container { width:1872px; height:82px; display:flex; align-items:center; justify-content: space-around; padding: 0 10px; box-sizing: border-box; }
        .highlight { color: white; } .oil { color: #00FF00; }
    </style></head>
    <body><div class="container">
        <span><span class="highlight">GIÁ PETROLIMEX:</span></span>
        <span><span class="highlight">95-III:</span> ${data.RON95_III}</span>
        <span><span class="highlight">E5-92:</span> ${data.E5}</span>
        <span><span class="highlight">DO 0,001:</span> <span class="oil">${data.DO_001}</span></span>
        <span><span class="highlight">DO 0,05:</span> <span class="oil">${data.DO_05}</span></span>
    </div></body></html>`;

    // Ghi file HTML
    fs.writeFileSync('giaxang_v1.html', createHTML('VÙNG 1'));
    // Bạn có thể tạo logic riêng cho Vùng 2 nếu cần lấy giá cột Vùng 2
    fs.writeFileSync('giaxang_v2.html', createHTML('VÙNG 2'));
    
    // Ghi file JSON để lưu trữ lịch sử nếu cần
    fs.writeFileSync('price.json', JSON.stringify(data, null, 2));

    console.log("✅ Đã cập nhật giá mới vào HTML");
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await browser.close();
  }
})();
