// saxkung/sax-music-admin/next.config.ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? '/'
    : undefined,

  // ⭐️ แก้ปัญหา Tailwind v4 ไม่ resolve จาก parent directory
  experimental: {
    turbo: {
      resolveAlias: {
        tailwindcss: path.resolve(__dirname, "node_modules/tailwindcss"),
      },
    },
  },
};

export default nextConfig;