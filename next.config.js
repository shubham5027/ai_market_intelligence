/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  serverExternalPackages: ['cheerio', 'playwright'],
};

module.exports = nextConfig;
