import { withGTConfig } from 'gt-next/config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dora-world.com',
      },
      {
        protocol: 'https',
        hostname: 'fujiko-museum.com',
      },
    ],
  },
};

export default withGTConfig(nextConfig, {
  experimentalEnableSSG: true,
});
