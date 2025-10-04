/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', pathname: '/uploads/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/uploads/**' },
      { protocol: 'http',  hostname: 'tuition-platform-production.up.railway.app', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'tuition-platform-production.up.railway.app', pathname: '/uploads/**' },
    ],
  },

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // 🔑 Add rewrites so /api/* in the browser forwards to your backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*', // backend in dev
      },
    ];
  },
};

module.exports = nextConfig;
