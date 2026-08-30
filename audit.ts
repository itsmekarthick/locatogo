import { chromium } from "@playwright/test";
import * as fs from "fs";

const BASE = "http://localhost:3000";
const OUT = "C:/Users/karth/.gemini/antigravity/brain/cbcaf425-6641-4ef0-b5c1-014c3b05ba6b";

async function screenshotPage(page: any, path: string, filename: string, waitMs = 3000) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: `${OUT}/${filename}`, fullPage: false });
  console.log(`✅ ${path} → ${filename}`);
}

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: ["--window-size=1440,900"],
  });
  const context = await browser.newContext({
    permissions: ["geolocation"],
    geolocation: { latitude: 12.9715893, longitude: 77.5945856, accuracy: 10 },
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const routes = [
    ["/", "audit_home.png", 5000],
    ["/listings", "audit_listings.png", 3000],
    ["/submit", "audit_submit.png", 2000],
    ["/auth/login", "audit_login.png", 2000],
    ["/auth/signup", "audit_signup.png", 2000],
    ["/auth/forgot-password", "audit_forgot_password.png", 2000],
    ["/about", "audit_about.png", 2000],
    ["/contact", "audit_contact.png", 2000],
    ["/admin", "audit_admin.png", 3000],
    ["/admin/listings", "audit_admin_listings.png", 3000],
    ["/admin/categories", "audit_admin_categories.png", 3000],
    ["/admin/settings", "audit_admin_settings.png", 3000],
  ];

  for (const [path, filename, wait] of routes) {
    await screenshotPage(page, path as string, filename as string, wait as number);
  }

  await browser.close();
  console.log("\n🎉 Audit screenshots complete.");
})();

