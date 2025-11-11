// auth.config.ts
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials'; 

// ⭐️ รวม providers, pages และ session เข้ามาที่นี่
export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // ตรวจสอบ username/password (ใช้ Environment Variables เหมือนเดิม)
        const validUsername = process.env.ADMIN_USERNAME;
        const validPassword = process.env.ADMIN_PASSWORD;

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
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    // ⭐️ authorized callback (สำหรับ Middleware)
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === '/login';
      const isOnPublic = nextUrl.pathname.startsWith('/_next') || 
                        nextUrl.pathname.startsWith('/favicon');
      
      if (isOnPublic) return true;
      if (isOnLogin) return true;
      
      return isLoggedIn;
    },
    // ⭐️ jwt callback
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    // ⭐️ session callback
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    }
  },
} satisfies NextAuthConfig;