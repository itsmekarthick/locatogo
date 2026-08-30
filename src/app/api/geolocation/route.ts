import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    let ip = forwardedFor?.split(",")[0]?.trim() || realIp || "";

    // Ignore localhost loopback IPs for external lookup
    if (
      !ip ||
      ip === "::1" ||
      ip === "127.0.0.1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.16.")
    ) {
      ip = "";
    }

    const ipApiUrl = ip ? `https://ipwho.is/${ip}` : "https://ipwho.is/";
    const res = await fetch(ipApiUrl, {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "LocatogoApp/1.0" },
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

