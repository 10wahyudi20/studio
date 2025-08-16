import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  serverActions: {
    bodySizeLimit: '2mb',
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  }
};

export default nextConfig;
