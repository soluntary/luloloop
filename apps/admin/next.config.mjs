/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ludoloop/ui', '@ludoloop/shared', '@ludoloop/database', '@ludoloop/auth'],
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../../'),
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
