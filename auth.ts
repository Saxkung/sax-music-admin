import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // ตรวจสอบ username/password
        const validUsername = process.env.ADMIN_USERNAME || "admin";
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
            email: "admin@saxmusic.com",
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
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === '/login';
      const isOnPublic = nextUrl.pathname.startsWith('/_next') || 
                        nextUrl.pathname.startsWith('/favicon');
      
      if (isOnPublic) return true;
      if (isOnLogin) return true;
      
      return isLoggedIn;
    },
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