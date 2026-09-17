import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") || "LocaToGo Atlas";
    const category = searchParams.get("category") || "Directory";
    const locality = searchParams.get("locality") || "Verified Location";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            backgroundColor: "#090d16",
            padding: "60px 80px",
            fontFamily: "sans-serif",
          }}
        >
          {/* Top Brand Tag */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                backgroundColor: "#e26a4f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              📍
            </div>
            <div style={{ color: "#ffffff", fontSize: "28px", fontWeight: "bold" }}>
              LocaToGo<span style={{ color: "#e26a4f" }}>.</span>
            </div>
            <div
              style={{
                marginLeft: "16px",
                backgroundColor: "rgba(226, 106, 79, 0.2)",
                color: "#f97316",
                padding: "4px 14px",
                borderRadius: "9999px",
                fontSize: "14px",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              {category}
            </div>
          </div>

          {/* Center Title & Locality */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                fontSize: "56px",
                fontWeight: "900",
                color: "#f3f4f6",
                lineHeight: "1.15",
                maxWidth: "950px",
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: "24px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📍</span>
              <span>{locality}</span>
            </div>
          </div>

          {/* Bottom Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: "24px",
              color: "#64748b",
              fontSize: "16px",
            }}
          >
            <span>Interactive Map & Multi-Domain Directory</span>
            <span style={{ color: "#e26a4f", fontWeight: "bold" }}>locatogo.com</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
