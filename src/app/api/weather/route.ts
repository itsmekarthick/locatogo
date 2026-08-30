import { NextRequest, NextResponse } from "next/server";
import { fetchPlaceWeather } from "@/lib/services/weather";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");

    const lat = latStr ? parseFloat(latStr) : null;
    const lng = lngStr ? parseFloat(lngStr) : null;

    const weather = await fetchPlaceWeather(lat, lng);
    if (!weather) {
      return NextResponse.json({ success: false, error: "Weather data unavailable" }, { status: 500 });
    }

    return NextResponse.json({ success: true, weather });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

