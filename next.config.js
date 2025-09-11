/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
      domains: ['res.cloudinary.com'],
    remotePatterns: [
      // localhost — match any port (3000, 5000, etc.) and only /uploads/**
      { protocol: 'http', hostname: 'localhost', pathname: '/uploads/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/uploads/**' },

      // Railway (cover both http and https just in case)
      { protocol: 'http',  hostname: 'tuition-platform-production.up.railway.app', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'tuition-platform-production.up.railway.app', pathname: '/uploads/**' },
    ],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
