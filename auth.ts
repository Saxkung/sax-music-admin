// saxkung/sax-music-admin/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config"; // ⭐️ Import authConfig

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig, // ⭐️ ใช้ authConfig สำหรับ authorized callback
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // ตรวจสอบ username/password
        const validUsername = process.env.ADMIN_USERNAME;
        if (!validUsername) {
          console.error("ADMIN_USERNAME not set in environment");
          return null;
        }
        const validPassword = process.env.ADMIN_PASSWORD;

        if (!validPassword) {
          console.error("ADMIN_PASSWORD not set in environment");
          return null;
        }

        if (
          credentials?.username === validUsername && 
          credentials?.password === validPassword
        ) {
          return {
            id: "1",
            name: "Admin",
            email: "info@saxmusic.com",
            role: "admin"
          };
        }
        
        return null;
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // ⭐️ ลบ authorized ออกไปที่ auth.config.ts แล้ว

    // เก็บ jwt และ session callbacks ไว้ที่นี่ (ไม่เกี่ยวกับ authorized)
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  }
});