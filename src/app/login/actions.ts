'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function loginAction(formData: FormData) {
  try {
    await signIn('credentials', {
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: 'Invalid credentials' };
    }
    throw error;
  }
}