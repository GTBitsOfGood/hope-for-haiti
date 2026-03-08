import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hopeforhaiti.blob.core.windows.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  reactStrictMode: false,
};

export default nextConfig;
