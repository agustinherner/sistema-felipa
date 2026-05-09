import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export type UsuarioFila = {
  id: string;
  username: string | null;
  nombre: string;
  rol: 'ADMIN' | 'VENDEDOR';
  activo: boolean;
  sucursalId: string | null;
  sucursalNombre: string | null;
  creadoEn: Date;
};

export type UsuariosFiltros = {
  q?: string;
  rol?: 'ADMIN' | 'VENDEDOR' | null;
  activo?: boolean | null;
};

export async function getUsuariosListado(
  filtros: UsuariosFiltros = {},
): Promise<UsuarioFila[]> {
  const where: Prisma.UserWhereInput = {};
  const q = filtros.q?.trim();
  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: 'insensitive' } },
      { username: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (filtros.rol) where.rol = filtros.rol;
  if (typeof filtros.activo === 'boolean') where.activo = filtros.activo;

  const filas = await prisma.user.findMany({
    where,
    orderBy: { nombre: 'asc' },
    select: {
      id: true,
      username: true,
      nombre: true,
      rol: true,
      activo: true,
      sucursalId: true,
      creadoEn: true,
      sucursal: { select: { nombre: true } },
    },
  });

  return filas.map((u) => ({
    id: u.id,
    username: u.username,
    nombre: u.nombre,
    rol: u.rol,
    activo: u.activo,
    sucursalId: u.sucursalId,
    sucursalNombre: u.sucursal?.nombre ?? null,
    creadoEn: u.creadoEn,
  }));
}

export type SucursalOpcion = { id: string; nombre: string };

export async function getSucursalesActivas(): Promise<SucursalOpcion[]> {
  return prisma.sucursal.findMany({
    where: { activa: true },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true },
  });
}
