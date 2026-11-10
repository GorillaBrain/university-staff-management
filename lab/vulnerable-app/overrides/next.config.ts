import type { NextConfig } from 'next';
const config: NextConfig = { devIndicators: false, poweredByHeader: false, serverExternalPackages: ['@prisma/client'] };
export default config;
