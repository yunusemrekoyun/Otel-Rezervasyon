import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['sharp'],
  // Hide the dev-only on-screen indicator (the floating "N" button).
  devIndicators: false,
};

export default nextConfig;
