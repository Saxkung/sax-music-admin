'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Library, Layers3, ArrowUpRight, LogOut, AudioLines } from 'lucide-react';
export default function StudioShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === '/login') return children;
  const links = [{ href: '/', label: 'คลังผลงาน', icon: Library, active: path === '/' || path.startsWith('/projects') }, { href: '/categories', label: 'หมวดหมู่', icon: Layers3, active: path.startsWith('/categories') }];
  return <div className="studio-shell"><aside className="studio-sidebar">
    <Link href="/" className="studio-brand"><AudioLines size={30} strokeWidth={1.4} /><span>SAX MUSIC<small>STUDIO</small></span></Link>
    <p className="nav-eyebrow">WORKSPACE</p><nav aria-label="เมนูหลัก">{links.map(({ icon: Icon, ...link }) => <Link key={link.href} href={link.href} className={link.active ? 'nav-link active' : 'nav-link'} aria-current={link.active ? 'page' : undefined}><Icon size={19} />{link.label}</Link>)}</nav>
    <div className="sidebar-bottom"><a href="https://saxmusic.site" target="_blank" rel="noreferrer" className="nav-link"><ArrowUpRight size={19} />ดูหน้าเว็บจริง</a><button className="nav-link" onClick={() => signOut({ callbackUrl: '/login' })}><LogOut size={18} />ออกจากระบบ</button><div className="account-line"><span className="avatar">S</span><span>Sax Music<small>Administrator</small></span><span className="online-dot" /></div></div>
  </aside><div className="studio-main"><header className="studio-topbar"><span>Music, thoughtfully presented.</span><button className="mobile-signout" onClick={() => signOut({ callbackUrl: '/login' })}><LogOut size={14} />ออกจากระบบ</button><a href="https://saxmusic.site" target="_blank" rel="noreferrer">saxmusic.site <ArrowUpRight size={14} /></a></header><main className="studio-content" id="main-content">{children}</main></div></div>;
}
