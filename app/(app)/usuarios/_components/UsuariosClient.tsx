'use client';

import { KeyRound, Pencil, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SucursalOpcion, UsuarioFila } from '@/lib/usuarios/queries';
import { Rol } from '@prisma/client';
import { EditarUsuarioDialog } from './EditarUsuarioDialog';
import { NuevoUsuarioDialog } from './NuevoUsuarioDialog';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { SwitchActivo } from './SwitchActivo';

type RolFiltro = 'TODOS' | Rol;
type ActivoFiltro = 'TODOS' | 'ACTIVOS' | 'INACTIVOS';

const FECHA_FMT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function UsuariosClient({
  usuarios,
  sucursales,
  currentUserId,
}: {
  usuarios: UsuarioFila[];
  sucursales: SucursalOpcion[];
  currentUserId: string;
}) {
  const [q, setQ] = useState('');
  const [rolFiltro, setRolFiltro] = useState<RolFiltro>('TODOS');
  const [activoFiltro, setActivoFiltro] = useState<ActivoFiltro>('TODOS');

  const [editingUser, setEditingUser] = useState<UsuarioFila | null>(null);
  const [resettingUser, setResettingUser] = useState<UsuarioFila | null>(null);
  const [showNuevo, setShowNuevo] = useState(false);

  const filtradas = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (rolFiltro !== 'TODOS' && u.rol !== rolFiltro) return false;
      if (activoFiltro === 'ACTIVOS' && !u.activo) return false;
      if (activoFiltro === 'INACTIVOS' && u.activo) return false;
      if (qLower) {
        const enNombre = u.nombre.toLowerCase().includes(qLower);
        const enUsername = u.username?.toLowerCase().includes(qLower) ?? false;
        if (!enNombre && !enUsername) return false;
      }
      return true;
    });
  }, [usuarios, q, rolFiltro, activoFiltro]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gestión de Usuarios</h1>
        <Button onClick={() => setShowNuevo(true)} className="gap-2">
          <UserPlus className="h-4 w-4" aria-hidden />
          Nuevo Usuario
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por nombre o usuario…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={rolFiltro}
          onChange={(e) => setRolFiltro(e.target.value as RolFiltro)}
          className="w-[180px]"
          aria-label="Filtrar por rol"
        >
          <option value="TODOS">Todos los roles</option>
          <option value="ADMIN">Admin</option>
          <option value="VENDEDOR">Vendedor</option>
        </Select>
        <Select
          value={activoFiltro}
          onChange={(e) => setActivoFiltro(e.target.value as ActivoFiltro)}
          className="w-[180px]"
          aria-label="Filtrar por estado"
        >
          <option value="TODOS">Todos los estados</option>
          <option value="ACTIVOS">Activos</option>
          <option value="INACTIVOS">Inactivos</option>
        </Select>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead className="w-[110px]">Activo</TableHead>
              <TableHead className="w-[110px]">Creado</TableHead>
              <TableHead className="w-[100px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No hay usuarios que coincidan con los filtros.
                </TableCell>
              </TableRow>
            ) : (
              filtradas.map((u) => {
                const esYoMismo = u.id === currentUserId;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nombre}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {u.username ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.rol === Rol.ADMIN ? 'default' : 'secondary'}
                      >
                        {u.rol === Rol.ADMIN ? 'Admin' : 'Vendedor'}
                      </Badge>
                    </TableCell>
                    <TableCell>{u.sucursalNombre ?? '—'}</TableCell>
                    <TableCell>
                      <SwitchActivo
                        userId={u.id}
                        activo={u.activo}
                        disabled={esYoMismo}
                        title={
                          esYoMismo
                            ? 'No podés desactivarte a vos mismo'
                            : undefined
                        }
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {FECHA_FMT.format(u.creadoEn)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => setEditingUser(u)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Resetear contraseña"
                          onClick={() => setResettingUser(u)}
                        >
                          <KeyRound className="h-4 w-4" />
                          <span className="sr-only">Resetear contraseña</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <NuevoUsuarioDialog
        open={showNuevo}
        onOpenChange={setShowNuevo}
        sucursales={sucursales}
      />
      {editingUser && (
        <EditarUsuarioDialog
          key={editingUser.id}
          usuario={editingUser}
          sucursales={sucursales}
          esYoMismo={editingUser.id === currentUserId}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingUser(null);
          }}
        />
      )}
      {resettingUser && (
        <ResetPasswordDialog
          key={resettingUser.id}
          usuario={resettingUser}
          open={true}
          onOpenChange={(open) => {
            if (!open) setResettingUser(null);
          }}
        />
      )}
    </div>
  );
}
