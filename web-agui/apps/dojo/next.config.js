/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow connections to the AG-UI backend
  async rewrites() {
    return [
      {
        source: '/agui/:path*',
        destination: `${process.env.NEXT_PUBLIC_NEXUS_BACKEND_URL || 'http://localhost:8000'}/agui/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
