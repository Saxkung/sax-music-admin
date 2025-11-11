// ลองแบบนี้ดู
   import { auth } from "@/auth";
   
   export const middleware = auth;
   
   export const config = {
     matcher: [
       '/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)',
     ],
   };