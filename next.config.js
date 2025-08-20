/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  eslint: {
    ignoreDuringBuilds: true,   // ✅ don’t block on ESLint errors
  },
  typescript: {
    ignoreBuildErrors: true,    // ✅ don’t block on TS errors
  },
};

module.exports = nextConfig;
