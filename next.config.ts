import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

const nextConfig = (phase: string): NextConfig => ({
  transpilePackages: ['@react-pdf/renderer'],
  // Independent servers/builds must not overwrite a running server's chunks.
  distDir: process.env.PORTFOLIO_TEST_SERVER === '1'
    ? '.next-test'
    : phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  typescript: {
    tsconfigPath: process.env.PORTFOLIO_TEST_SERVER === '1'
      ? 'tsconfig.browser.json'
      : phase === PHASE_DEVELOPMENT_SERVER ? 'tsconfig.dev.json' : 'tsconfig.json',
  },
});

export default nextConfig;
