/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  // Handle dynamic routes for static export
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig
