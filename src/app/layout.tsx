import type { Metadata } from 'next';
import { Inter, Noto_Sans_Thai } from 'next/font/google';
import StudioShell from '@/components/studio/StudioShell';
import './globals.css';
const inter = Inter({ subsets: ['latin'], variable: '--font-studio', display: 'swap' });
const thai = Noto_Sans_Thai({ subsets: ['thai'], variable: '--font-thai', display: 'swap' });
export const metadata: Metadata = { title: 'Sax Music Studio', description: 'Manage your music portfolio.', robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="th" className={`${inter.variable} ${thai.variable}`}><body><a className="skip-link" href="#main-content">ข้ามไปยังเนื้อหา</a><StudioShell>{children}</StudioShell></body></html>; }
