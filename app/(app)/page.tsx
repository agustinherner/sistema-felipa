import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';

export default async function AppIndexPage() {
  await requireAuth();
  redirect('/dashboard');
}
