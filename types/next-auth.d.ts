import 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

// ขยาย Module 'next-auth' เพื่อเพิ่ม 'role' ใน Session และ User
declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's role. */
      role: string;
    } & DefaultUser;
  }

  interface User {
    /** The user's role. */
    role: string;
  }
}

// ขยาย Module 'next-auth/jwt' เพื่อเพิ่ม 'role' ใน JWT
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    /** The user's role. */
    role?: string;
  }
}