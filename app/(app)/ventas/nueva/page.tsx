import { Rol } from '@prisma/client';
import { requireAuth } from '@/lib/auth/session';
import { requireTurnoAbierto } from '@/lib/turnos/guards';
import { VentaNuevaForm } from './_components/VentaNuevaForm';

export const metadata = {
  title: 'Nueva venta',
};

export default async function NuevaVentaPage() {
  // requireTurnoAbierto chequea auth + turno abierto. Si no hay turno → throw.
  // El middleware redirige a /turno/abrir cuando corresponde; acá igual hacemos
  // requireAuth explícito para que el usuario quede tipado.
  const user = await requireAuth([Rol.ADMIN, Rol.VENDEDOR]);
  await requireTurnoAbierto();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nueva venta</h1>
        <p className="text-sm text-muted-foreground">
          Vendiendo como <span className="font-medium">{user.name}</span>.
        </p>
      </div>

      <VentaNuevaForm />
    </div>
  );
}
