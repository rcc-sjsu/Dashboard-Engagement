import "@repo/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  async rewrites() {
    const serverUrl = process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8000";
    return [
      {
        source: "/api/analytics/:path*",
        destination: `${serverUrl}/analytics/:path*`,
      },
      {
        source: "/api/import/:path*",
        destination: `${serverUrl}/api/import/:path*`,
      },
    ];
  },
};

export default nextConfig;
