import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ludoloop/ui', '@ludoloop/shared', '@ludoloop/database', '@ludoloop/auth'],
  outputFileTracingRoot: join(__dirname, '../../'),
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
