'use client'; 

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link"; 
import { usePathname } from "next/navigation"; 
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react"; 
import { useState, useEffect } from "react"; // ⭐️⭐️⭐️ แก้ไขบรรทัดนี้ครับ ⭐️⭐️⭐️
import { cn } from "@/lib/utils"; 

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// (AdminNavbar component)
function AdminNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // ปิดเมนูเมื่อคลิกลิงก์
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/categories", label: "Categories" },
    { href: "/projects", label: "Projects" },
    { href: "/tracks", label: "Tracks" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-8">
        {/* Desktop Menu */}
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="font-bold text-lg hover:text-primary">
            SAX Music Admin
          </Link>
          
          <div className="hidden md:flex gap-4 items-center">
            {navLinks.map(link => (
              <Link 
                key={link.href} 
                href={link.href} 
                className={cn(
                  "hover:text-primary transition-colors",
                  pathname === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Button
              variant="outline" 
              size="sm"
              onClick={async () => {
                await signOut({ redirect: true, redirectTo: '/login' });
              }}
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>

          {/* Burger Menu (แสดงเฉพาะจอน้อยกว่า md) */}
          <div className="md:hidden">
            <Button 
              variant="outline" 
              size="icon-sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu (แสดงเมื่อกดปุ่ม) */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b z-40 p-4 space-y-2">
          {navLinks.map(link => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={cn(
                "block p-2 rounded-md hover:bg-accent",
                pathname === link.href ? "font-semibold text-primary" : "text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button
            variant="outline" 
            className="w-full"
            onClick={async () => {
              await signOut({ redirect: true, redirectTo: '/login' });
            }}
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      )}
    </nav>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="en" className="dark"> 
      <head>
        <title>Admin Panel - SAX MUSIC</title>
        <meta name="description" content="Admin management system" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      
      <body
        className={`${inter.variable} antialiased`}
      >
        {isLoginPage ? (
          children
        ) : (
          <div className="flex flex-col min-h-screen">
            <AdminNavbar />
            <div className="flex-1">
              {children}
            </div>
          </div>
        )}
      </body>
    </html>
  );
}