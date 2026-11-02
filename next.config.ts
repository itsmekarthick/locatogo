import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdf-parse"],
  // pdf-parse needs @napi-rs/canvas for DOMMatrix; the native binary is chosen at runtime, so file tracing cannot see it.
  outputFileTracingIncludes: {
    "/api/parse-resume": ["./node_modules/@napi-rs/**/*", "./node_modules/pdfjs-dist/**/*"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "host", value: "app.localhost" }],
          destination: "/map",
        },
        {
          source: "/",
          has: [{ type: "host", value: "app.locatogo.com" }],
          destination: "/map",
        },
        {
          source: "/",
          has: [{ type: "host", value: "tech.locatogo.com" }],
          destination: "/map",
        },
      ],
    };
  },
  async redirects() {
    return [
      {
        source: "/tech/:path*",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
  async headers() {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://localhost");
    const localSupabaseSource = process.env.NODE_ENV === "development" && supabaseUrl.protocol === "http:" && ["localhost", "127.0.0.1"].includes(supabaseUrl.hostname) ? ` ${supabaseUrl.origin}` : "";
    const localWebSocketSource = localSupabaseSource ? ` ${supabaseUrl.origin.replace("http:", "ws:")}` : "";
    return [{ source: "/(.*)", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "X-Frame-Options", value: "DENY" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=*" }, { key: "Content-Security-Policy", value: `default-src 'self'; img-src 'self' data: https:${localSupabaseSource}; style-src 'self' 'unsafe-inline' https://unpkg.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://va.vercel-scripts.com; connect-src 'self' https:${localSupabaseSource}${localWebSocketSource}; frame-ancestors 'none';` }] }];
  },
};

export default nextConfig;
