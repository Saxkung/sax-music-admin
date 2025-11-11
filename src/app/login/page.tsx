'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
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
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
    <div className="max-w-md w-full mx-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-900/50 rounded-full mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white">Admin Login</h2>
          <p className="text-gray-400 mt-2">SAX Music Admin Panel</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-900">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              required
              disabled={isPending}
              placeholder="Enter your username"
              className="w-full bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isPending}
              placeholder="Enter your password"
              className="w-full bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={isPending}
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

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Protected by NextAuth.js</p>
        </div>
      </div>
    </div>
  </div>
);
}