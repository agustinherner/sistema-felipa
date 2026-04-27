import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/mock';

export default async function AppIndexPage() {
  const user = await requireAuth();
  redirect(user.role === 'admin' ? '/dashboard' : '/nueva-venta');
}
