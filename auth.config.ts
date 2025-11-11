// auth.config.ts
import type { NextAuthConfig } from 'next-auth';

// ⭐️ ย้าย authorized callback มาไว้ที่นี่
export const authConfig = {
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === '/login';
      const isOnPublic = nextUrl.pathname.startsWith('/_next') || 
                        nextUrl.pathname.startsWith('/favicon');
      
      if (isOnPublic) return true;
      if (isOnLogin) return true;
      
      return isLoggedIn;
    },
  },
  
} satisfies NextAuthConfig;