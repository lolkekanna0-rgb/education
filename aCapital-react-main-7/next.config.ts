import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // нужно, если используешь next/image
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
