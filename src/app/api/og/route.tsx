import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") || "LocaToGo Tech Atlas";
    const category = searchParams.get("category") || "Technology Directory";
    const locality = searchParams.get("locality") || "India";
    const jobs = searchParams.get("jobs");

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
            backgroundColor: "#070b14",
            padding: "60px 75px",
            fontFamily: "sans-serif",
            backgroundImage: "radial-gradient(circle at 85% 15%, rgba(99, 102, 241, 0.18) 0%, transparent 60%)",
          }}
        >
          {/* Top Header Tag */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  backgroundColor: "#4f46e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "26px",
                  fontWeight: "bold",
                }}
              >
                📍
              </div>
              <div style={{ color: "#ffffff", fontSize: "32px", fontWeight: "900", letterSpacing: "-0.5px" }}>
                LocaToGo<span style={{ color: "#6366f1" }}>.</span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.4)",
                color: "#a5b4fc",
                padding: "6px 16px",
                borderRadius: "9999px",
                fontSize: "14px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {category}
            </div>
          </div>

          {/* Center Title, Locality & Jobs Badge */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "1020px" }}>
            <div
              style={{
                fontSize: title.length > 35 ? "52px" : "64px",
                fontWeight: "900",
                color: "#ffffff",
                lineHeight: "1.15",
                letterSpacing: "-1px",
              }}
            >
              {title}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ fontSize: "24px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📍</span>
                <span>{locality}</span>
              </div>

              {jobs && Number(jobs) > 0 && (
                <div
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.5)",
                    color: "#34d399",
                    padding: "6px 16px",
                    borderRadius: "9999px",
                    fontSize: "18px",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>💼</span>
                  <span>{jobs} Verified Openings</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Branding Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: "24px",
              color: "#64748b",
              fontSize: "18px",
            }}
          >
            <span>Verified Tech Ecosystem Directory &amp; Live Atlas</span>
            <span style={{ color: "#818cf8", fontWeight: "bold" }}>locatogo.com</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate the image: ${e.message}`, {
      status: 500,
    });
  }
}
