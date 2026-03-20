/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  serverExternalPackages: ['cheerio', 'playwright'],
  experimental: {
    turbo: {
      root: __dirname,
    },
  },
};

module.exports = nextConfig;
