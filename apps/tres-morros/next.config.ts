import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "flowfront.imgix.net",
      },
    ],
  },
  eslint: {
    dirs: ["src"],
  },
};

export default nextConfig;
