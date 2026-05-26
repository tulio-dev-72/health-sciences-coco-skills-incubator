import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow phones on the LAN to load dev JS bundles (Next.js 16 blocks by default).
  allowedDevOrigins: ["192.168.7.30", "192.168.7.30:3000"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
