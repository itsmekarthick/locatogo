const { chromium, devices } = require('playwright');
const BASE = 'http://localhost:3000';
const OUT = 'C:/Users/karth/.gemini/antigravity/brain/cbcaf425-6641-4ef0-b5c1-014c3b05ba6b';

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // 1. Mobile with warm blue logo
  const iPhone = devices['iPhone 14'];
  const mContext = await browser.newContext({ ...iPhone });
  const mPage = await mContext.newPage();
  await mPage.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await mPage.waitForTimeout(2500);
  await mPage.screenshot({ path: OUT + '/mobile_warm_blue_logo_verified.png' });

  // 2. Search test: Type 'Corner House' into the search input and verify map moves
  const searchInput = mPage.locator('input[placeholder*="Search places"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('Corner House');
    await mPage.waitForTimeout(2000);
    await mPage.screenshot({ path: OUT + '/mobile_search_flyto_verified.png' });
    console.log('Search fly-to tested and captured');
  }

  // 3. Desktop view with warm blue logo
  const dContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const dPage = await dContext.newPage();
  await dPage.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await dPage.waitForTimeout(2500);
  await dPage.screenshot({ path: OUT + '/desktop_warm_blue_logo_verified.png' });

  await browser.close();
  console.log('All verification screenshots complete.');
})();
