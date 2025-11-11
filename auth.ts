// saxkung/sax-music-admin/auth.ts
import NextAuth from "next-auth";
// import Credentials from "next-auth/providers/credentials"; // ❌ ไม่ต้องใช้ตรงนี้แล้ว
import { authConfig } from "./auth.config"; // ⭐️ Import authConfig

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig, // ⭐️ ใช้ config ที่สมบูรณ์
  // ❌ ลบ providers, pages, session, callbacks ทั้งหมดออกจากตรงนี้
});