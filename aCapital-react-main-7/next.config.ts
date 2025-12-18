import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // нужно, если используешь next/image
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Убеждаемся, что используется App Router
  },
  // Отключаем статическую оптимизацию для проблемных страниц
  output: undefined,
};

export default nextConfig;
