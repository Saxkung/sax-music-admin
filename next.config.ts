// saxkung/sax-music-admin/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone', // (ค่าเดิม ถูกต้องแล้ว)
  output: 'standalone',
  
  // ⭐️⭐️⭐️ เพิ่มการตั้งค่านี้ ⭐️⭐️⭐️
  // เพื่อให้มั่นใจว่า Static Assets ถูกอ้างอิงจาก Root Path ของ Custom Domain
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? '/' // ใช้ '/' เพื่อชี้ไปที่ Root ของ Custom Domain (admin.saxmusic.site)
    : undefined,
};

export default nextConfig;