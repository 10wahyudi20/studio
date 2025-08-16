import type {NextConfig} from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read package.json to get the version
const packageJsonPath = join(process.cwd(), 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));


const nextConfig: NextConfig = {
  /* config options here */
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
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  }
};

export default nextConfig;
