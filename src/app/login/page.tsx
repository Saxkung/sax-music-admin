'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LockKeyhole } from 'lucide-react';
import { loginAction } from './actions';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        const result = await loginAction(formData);
        
        if (result.success) {
          router.push('/');
          router.refresh();
        } else {
          setError(result.error || 'Login failed');
        }
      } catch (err: any) {
        console.error('Login error:', err);
        setError('An unexpected error occurred');
      }
    });
  };

  return (
    // ⭐️ 1. ใช้ bg-background และเพิ่ม padding
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* ⭐️ 2. ใช้ max-w-sm ให้ฟอร์มกระชับขึ้น */}
      <div className="max-w-sm w-full">
        
        {/* ⭐️ 3. ย้าย Header ออกมาไว้นอก Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-full mb-4">
            <LockKeyhole className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Admin Login</h2>
          <p className="text-muted-foreground mt-2">SAX Music Admin Panel</p>
        </div>

        {/* ⭐️ 4. Card สำหรับฟอร์ม */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-muted-foreground mb-2">
                Username
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username" // ⭐️ เพิ่ม autocomplete
                disabled={isPending}
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-2">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password" // ⭐️ เพิ่ม autocomplete
                disabled={isPending}
                placeholder="Enter your password"
              />
            </div>

            {/* ⭐️ 5. ย้าย Error มาไว้ก่อนปุ่ม */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full" // ⭐️ ลบสี Hardcode ออก
              disabled={isPending}
              size="lg" // ⭐️ ขยายปุ่มให้ใหญ่ขึ้น
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </div>
        
      </div>
    </div>
  );
}