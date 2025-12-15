import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-376ad58b5142480bbd54b6f33055bfb1.r2.dev',
      },
    ],
  },
};

export default nextConfig;
