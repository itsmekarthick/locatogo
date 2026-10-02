import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
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
  async headers() {
    return [{ source: "/(.*)", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "X-Frame-Options", value: "DENY" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=*" }, { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://unpkg.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://va.vercel-scripts.com; connect-src 'self' https:; frame-ancestors 'none';" }] }];
  },
};

export default nextConfig;
