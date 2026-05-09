import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { requireAuth } from '@/lib/auth/session';
import { getTurnoOlvidado } from '@/lib/turnos/guards';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  const pathname = headers().get('x-pathname') ?? '';
  if (pathname !== '/turno/cerrar') {
    const turnoOlvidado = await getTurnoOlvidado(user.id);
    if (turnoOlvidado) redirect('/turno/cerrar');
  }

  return (
    <div className="flex h-screen w-full bg-muted/20">
      <Sidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
