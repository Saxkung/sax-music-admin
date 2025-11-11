// saxkung/sax-music-admin/src/middleware.ts
   import { auth } from "@/auth";
   
   export const middleware = auth;
   
   // ❌ ลบส่วนนี้ออก
   // export const config = {
   //   matcher: [
   //     '/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)',
   //   ],
   // };

   // ⭐️ หรือคงไว้ตามเดิมหากคุณต้องการควบคุม Matcher
   // ในโค้ดเดิมของคุณ:
   export const config = {
     matcher: [
       '/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)',
     ],
   };