import { NextResponse } from "next/server";

// --- Simple in-memory rate limiter (resets on server restart / cold-start) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;    // requests
const WINDOW_MS = 60_000; // per 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

export async function GET(request: Request) {
  // --- Rate limiting ---
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  let ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, message: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    // Ignore localhost / private IPs for external lookup
    if (
      !ip ||
      ip === "::1" ||
      ip === "127.0.0.1" ||
      ip === "unknown" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.16.")
    ) {
      ip = "";
    }

    const ipApiUrl = ip ? `https://ipwho.is/${ip}` : "https://ipwho.is/";
    const res = await fetch(ipApiUrl, {
      next: { revalidate: 3600 }, // cache 1 hour per IP
      headers: { "User-Agent": "LocaToGoApp/1.0" },
    });

    if (!res.ok) {
      throw new Error(`IP Geo API responded with status ${res.status}`);
    }

    const data = await res.json();

    if (data.success !== false && data.latitude && data.longitude) {
      return NextResponse.json({
        success: true,
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city || null,
        region: data.region || null,
        country: data.country || null,
        source: "network_ip",
      });
    }

    return NextResponse.json(
      { success: false, message: "Could not resolve IP coordinates" },
      { status: 404 }
    );
  } catch (error: any) {
    console.warn("IP Geolocation API error:", error?.message);
    return NextResponse.json(
      { success: false, message: "IP Geolocation fallback failed" },
      { status: 500 }
    );
  }
}
