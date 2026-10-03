'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { X, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return children ? <div className={`notice ${error ? 'notice-error' : ''}`} role={error ? 'alert' : 'status'}>{children}</div> : null;
}
export function Loading() { return <div className="loading-state" role="status"><Loader2 className="spin" />กำลังโหลดผลงาน…</div>; }
export function Dialog({ open, title, children, onClose, busy = false }: { open: boolean; title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open) ref.current?.showModal(); else ref.current?.close(); }, [open]);
  return <dialog ref={ref} className="studio-dialog" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }} aria-label={title}>
    <div className="dialog-heading"><h2>{title}</h2><button type="button" className="icon-button" aria-label="ปิดหน้าต่าง" onClick={onClose} disabled={busy}><X size={20} /></button></div>{children}
  </dialog>;
}
export function OrderButtons({ name, first, last, disabled, move }: { name: string; first: boolean; last: boolean; disabled: boolean; move: (direction: number) => void }) {
  return <div className="order-buttons"><button className="icon-button" type="button" disabled={first || disabled} onClick={() => move(-1)} title={`เลื่อน ${name} ขึ้น`} aria-label={`เลื่อน ${name} ขึ้น`}><ArrowUp size={17} /></button><button className="icon-button" type="button" disabled={last || disabled} onClick={() => move(1)} title={`เลื่อน ${name} ลง`} aria-label={`เลื่อน ${name} ลง`}><ArrowDown size={17} /></button></div>;
}
