const { chromium } = require('playwright');
const fs = require('fs');

async function scrapePrice() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let prices = { p95: "00.000", do001: "00.000", do05: "00.000" };

  try {
    // THỬ NGUỒN 1: PETAJICO HÀ NỘI
    console.log("🔍 Thử nguồn 1: Petajico...");
    await page.goto('https://petajicohanoi.petrolimex.com.vn/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const data = await page.evaluate(() => {
      const res = {};
      const rows = Array.from(document.querySelectorAll('tr, div'));
      rows.forEach(r => {
        const txt = r.innerText.toUpperCase();
        const matches = txt.match(/(\d{2}\.\d{3})/);
        if (matches) {
          if (txt.includes('RON 95-III') && !res.p95) res.p95 = matches[1];
          if (txt.includes('0,001S-V') && !res.do001) res.do001 = matches[1];
          if (txt.includes('0,05S-II') && !res.do05) res.do05 = matches[1];
        }
      });
      return res;
    });
    
    // Nếu nguồn 1 lấy được giá, dùng luôn
    if (data.p95 && data.p95 !== "00.000") {
        prices = data;
    } else {
        // THỬ NGUỒN 2: PETROLIMEX CHÍNH (DỰ PHÒNG)
        console.log("⚠️ Nguồn 1 lỗi, thử nguồn 2: Petrolimex chính...");
        await page.goto('https://www.petrolimex.com.vn/index.html', { waitUntil: 'domcontentloaded' });
        // ... (Logic quét nguồn chính ở đây)
    }

  } catch (e) {
    console.error("❌ Lỗi cào dữ liệu:", e.message);
  } finally {
    await browser.close();
    return prices;
  }
}
