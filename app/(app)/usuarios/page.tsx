import { Rol } from '@prisma/client';
import { requireAuth } from '@/lib/auth/session';
import {
  getSucursalesActivas,
  getUsuariosListado,
} from '@/lib/usuarios/queries';
import { UsuariosClient } from './_components/UsuariosClient';

export default async function UsuariosPage() {
  const session = await requireAuth([Rol.ADMIN]);

  const [usuarios, sucursales] = await Promise.all([
    getUsuariosListado(),
    getSucursalesActivas(),
  ]);

  return (
    <UsuariosClient
      usuarios={usuarios}
      sucursales={sucursales}
      currentUserId={session.id}
    />
  );
}
