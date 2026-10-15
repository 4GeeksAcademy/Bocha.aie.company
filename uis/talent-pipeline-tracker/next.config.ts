import type { NextConfig } from "next";

const backendBaseUrl = process.env.INTERNAL_BACKEND_URL ?? "http://backend:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${backendBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
