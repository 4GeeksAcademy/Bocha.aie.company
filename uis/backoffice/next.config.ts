import type {
  NextConfig
} from "next";


const backendBaseUrl = (
  process.env.INTERNAL_BACKEND_URL
  ?? process.env.NEXT_PUBLIC_INVENTORY_API_URL
  ?? "http://backend:8000"
).replace(/\/$/, "");


const nextConfig: NextConfig = {

  async rewrites() {

    return [

      {
        source:
          "/backend/:path*",

        destination:
          `${backendBaseUrl}/:path*`,
      },

    ];

  },

};


export default nextConfig;
