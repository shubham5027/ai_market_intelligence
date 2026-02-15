/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'cheerio', 'playwright'];
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['cheerio', 'playwright'],
  },
};

module.exports = nextConfig;
