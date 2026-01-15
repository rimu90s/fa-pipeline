import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/report/_debug/context",
        destination: "/api/report/debug/context",
      },
    ];
  },
};

export default nextConfig;
