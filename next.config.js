/** @type {import('next').NextConfig} */
// v24 – force full cache rebuild (2026-03-24)
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'picsum.photos'],
  },
  generateBuildId: async () => 'v24-vivante-2026-03-24',
};

module.exports = nextConfig;
