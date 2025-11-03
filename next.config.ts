import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  ignoreBuildErrors: true,
};

export default nextConfig;
