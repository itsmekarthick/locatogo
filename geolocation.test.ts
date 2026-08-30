import { test, expect, chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const MOCK_LAT = 12.9715893;
const MOCK_LNG = 77.5945856;

test("GPS granted - map should fly to user location on load", async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({
    permissions: ["geolocation"],
    geolocation: { latitude: MOCK_LAT, longitude: MOCK_LNG, accuracy: 10 },
  });
  const page = await context.newPage();

  const logs: string[] = [];
  page.on("console", (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));

  await page.goto(BASE, { waitUntil: "networkidle" });

  // Wait for geolocation to resolve and map to fly
  await page.waitForTimeout(6000);

  console.log("\n=== CONSOLE LOGS (GPS Granted) ===");
  logs.forEach((l) => console.log(l));

  const mapState = await page.evaluate(() => {
    const mapEls = document.querySelectorAll(".leaflet-container");
    if (mapEls.length === 0) return { error: "No leaflet map found" };
    const mapEl = mapEls[0] as any;
    const map = mapEl._leaflet_map;
    if (!map) return { error: "No _leaflet_map on element" };
    const c = map.getCenter();
    return { lat: c.lat, lng: c.lng, zoom: map.getZoom() };
  });

  console.log("\nMap state:", JSON.stringify(mapState));

  const markerCount = await page.locator(".leaflet-marker-icon").count();
  console.log("Marker count:", markerCount);

  const locBtn = await page.locator("button").filter({ hasText: /Location Active|Detect My Location|Detecting/i }).first().textContent().catch(() => "NOT FOUND");
  console.log("Location button:", locBtn);

  await page.screenshot({ path: "C:/Users/karth/.gemini/antigravity/brain/cbcaf425-6641-4ef0-b5c1-014c3b05ba6b/gps_granted.png" });
  console.log("Screenshot saved: gps_granted.png");

  await browser.close();
});

test("GPS denied - IP fallback should still position map", async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({
    permissions: [],
  });
  const page = await context.newPage();

  const logs: string[] = [];
  page.on("console", (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));

  // Deny geolocation at the browser level
  await context.grantPermissions([], { origin: BASE });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(6000);

  console.log("\n=== CONSOLE LOGS (GPS Denied) ===");
  logs.forEach((l) => console.log(l));

  const mapState = await page.evaluate(() => {
    const mapEls = document.querySelectorAll(".leaflet-container");
    if (mapEls.length === 0) return { error: "No leaflet map found" };
    const mapEl = mapEls[0] as any;
    const map = mapEl._leaflet_map;
    if (!map) return { error: "No _leaflet_map on element" };
    const c = map.getCenter();
    return { lat: c.lat, lng: c.lng, zoom: map.getZoom() };
  });

  console.log("\nMap state (IP fallback):", JSON.stringify(mapState));

  await page.screenshot({ path: "C:/Users/karth/.gemini/antigravity/brain/cbcaf425-6641-4ef0-b5c1-014c3b05ba6b/gps_denied.png" });
  console.log("Screenshot saved: gps_denied.png");

  await browser.close();
});

