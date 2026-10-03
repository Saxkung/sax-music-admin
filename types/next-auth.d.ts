import type { DefaultSession } from 'next-auth';
import 'next-auth/jwt';
declare module 'next-auth' {
  interface Session { user: NonNullable<DefaultSession['user']> & { role: string }; }
  interface User { role: string; }
}
declare module 'next-auth/jwt' { interface JWT { role?: string; } }
