import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http", // or 'https' if your local API uses SSL
        hostname: "localhost",
        port: "8080", // Specify the port your API runs on
        pathname: "/api/v1/files/download/**", // Be more specific if possible
      },
    ],
  },
  /* other config options can remain here */
};

export default nextConfig;
