import { NextRequest, NextResponse } from "next/server";

// In-memory cache for recent responses to prevent hammering external services
interface CacheEntry {
  buffer?: Buffer;
  contentType: string;
  isSvg: boolean;
  svgText?: string;
  expiresAt: number;
}

const logoCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 1000;

const GRADIENT_PAIRS = [
  ["#0284c7", "#7c3aed"],
  ["#0891b2", "#2563eb"],
  ["#059669", "#0d9488"],
  ["#e11d48", "#db2777"],
  ["#d97706", "#ea580c"],
  ["#7c3aed", "#c026d3"],
  ["#0ea5e9", "#0284c7"],
  ["#334155", "#0f172a"],
];

function generateFallbackSvg(title: string): string {
  const cleanTitle = title
    .replace(/\b(Pvt|Ltd|Limited|Technologies|Tech|Labs|Hospital|School|Cafe|Solutions)\b/gi, "")
    .trim();
  const words = cleanTitle.split(/\s+/).filter(Boolean);
  const initials = (
    words.length > 1
      ? (words[0][0] + words[1][0])
      : title.slice(0, 2)
  ).toUpperCase() || "CO";

  const hash = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const [c1, c2] = GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#g)" />
  <text x="50%" y="54%" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="22" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="0.5">${initials}</text>
</svg>`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain")?.trim().toLowerCase() || "";
  const title = searchParams.get("title")?.trim() || domain || "Company";

  const cacheKey = `${domain}_${title}`;
  const now = Date.now();

  const cached = logoCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    if (cached.isSvg && cached.svgText) {
      return new NextResponse(cached.svgText, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        },
      });
    }
    if (cached.buffer) {
      return new NextResponse(new Uint8Array(cached.buffer), {
        status: 200,
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=604800, s-maxage=1209600, immutable",
        },
      });
    }
  }

  // If no domain provided, return generated branded SVG immediately
  if (!domain || !domain.includes(".")) {
    const svg = generateFallbackSvg(title);
    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  }

  // Try fetching external favicon with short timeout (DuckDuckGo or Google)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const ddgUrl = `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
    const res = await fetch(ddgUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LocaToGoBot/1.0)",
        Accept: "image/*,*/*",
      },
      next: { revalidate: 604800 },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = res.headers.get("content-type") || "image/x-icon";

      if (buffer.length > 80) {
        if (logoCache.size >= MAX_CACHE_SIZE) {
          logoCache.clear();
        }
        logoCache.set(cacheKey, {
          buffer,
          contentType,
          isSvg: false,
          expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=604800, s-maxage=1209600, immutable",
          },
        });
      }
    }
  } catch {
    // Timeout or network error - gracefully fall through to SVG
  }

  // Fallback: Return branded 200 OK SVG instead of 404 to avoid console errors
  const fallbackSvg = generateFallbackSvg(title);
  if (logoCache.size >= MAX_CACHE_SIZE) {
    logoCache.clear();
  }
  logoCache.set(cacheKey, {
    isSvg: true,
    svgText: fallbackSvg,
    contentType: "image/svg+xml",
    expiresAt: now + 24 * 60 * 60 * 1000, // 1 day
  });

  return new NextResponse(fallbackSvg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
