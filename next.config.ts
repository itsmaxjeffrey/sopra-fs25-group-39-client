import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/api/v1/files/download/**",
      },
      {
        // Add pattern for the production domain
        protocol: "https", 
        hostname: process.env.NEXT_PUBLIC_PROD_API_HOSTNAME || "sopra-fs25-group-39-server.oa.r.appspot.com", // Use env var or fallback
        // Port is not needed for standard HTTPS (443)
        pathname: "/api/v1/files/download/**",
      },
    ],
  },
  /* other config options can remain here */
};

export default nextConfig;
