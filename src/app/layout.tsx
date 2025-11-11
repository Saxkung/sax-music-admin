// src/app/layout.tsx (อัปเดต - ย้าย Logic ทั้งหมดไปที่ Middleware)
'use client'; // ⭐️ 1. (สำคัญมาก) เปลี่ยนเป็น Client Component

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link"; 
import { usePathname } from "next/navigation"; 
import { signOut } from "next-auth/react";

// ⭐️ 3. ลบ 'cookies', 'headers', 'redirect', 'use' ออกจาก imports

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ⭐️ 4. (สำคัญมาก) ลบ 'export const metadata' ออก
// เราไม่สามารถใช้ metadata ที่ export ใน Client Component ได้
// (ถ้าจำเป็น เราจะต้องย้ายไปที่ (layout) folder อื่น แต่ตอนนี้ลบไปก่อน)
/*
export const metadata: Metadata = {
  title: "Admin Panel - SAX Music", 
  description: "Admin management system", 
};
*/

// (AdminNavbar component ... ไม่มีการแก้ไข)
function AdminNavbar() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-8 py-4">
        <div className="flex gap-6 items-center">
          <Link href="/" className="font-bold text-lg hover:text-primary">
            SAX Music Admin
          </Link>
          <div className="flex gap-4 ml-auto">
            <Link href="/" className="hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/categories" className="hover:text-primary transition-colors">
              Categories
            </Link>
            <Link href="/projects" className="hover:text-primary transition-colors">
              Projects
            </Link>
            <Link href="/tracks" className="hover:text-primary transition-colors">
              Tracks
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button 
                onClick={async (e) => {
                  e.preventDefault(); 
                  await signOut({ redirect: true, redirectTo: '/login' });
                }}
                className="hover:text-destructive transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // ⭐️ 5. ใช้ 'usePathname' (ซึ่งปลอดภัยใน Client Component)
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="en" className="dark"> 
      
      <head>
        <title>Admin Panel - SAX MUSIC</title>
        <meta name="description" content="Admin management system" />
      </head>
      
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ⭐️ 7. ตรวจสอบ Path (Logic นี้ปลอดภัย) */}
        {isLoginPage ? (
          children
        ) : (
          <>
            <AdminNavbar />
            {children}
          </>
        )}
      </body>
    </html>
  );
}