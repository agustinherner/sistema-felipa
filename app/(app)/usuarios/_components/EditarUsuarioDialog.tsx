'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { editarUsuario } from '@/lib/usuarios/actions';
import type { SucursalOpcion, UsuarioFila } from '@/lib/usuarios/queries';
import { Rol } from '@prisma/client';

export function EditarUsuarioDialog({
  open,
  onOpenChange,
  usuario,
  sucursales,
  esYoMismo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: UsuarioFila;
  sucursales: SucursalOpcion[];
  esYoMismo: boolean;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState(usuario.nombre);
  const [rol, setRol] = useState<Rol>(usuario.rol);
  const [sucursalId, setSucursalId] = useState(
    usuario.sucursalId ?? sucursales[0]?.id ?? '',
  );
  const [errores, setErrores] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrores([]);
    setPending(true);

    const res = await editarUsuario({
      userId: usuario.id,
      nombre,
      rol,
      sucursalId,
    });

    if (!res.ok) {
      setErrores(res.errores);
      setPending(false);
      return;
    }

    router.refresh();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {errores.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {errores.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground">
            Usuario:{' '}
            <span className="font-mono">{usuario.username ?? '—'}</span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-nombre">Nombre completo</Label>
            <Input
              id="edit-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={pending}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="edit-rol">Rol</Label>
              <Select
                id="edit-rol"
                value={rol}
                onChange={(e) => setRol(e.target.value as Rol)}
                disabled={pending || esYoMismo}
              >
                <option value="VENDEDOR">Vendedor</option>
                <option value="ADMIN">Admin</option>
              </Select>
              {esYoMismo && (
                <p className="text-xs text-muted-foreground">
                  No podés cambiarte el rol a vos mismo.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sucursal">Sucursal</Label>
              <Select
                id="edit-sucursal"
                value={sucursalId}
                onChange={(e) => setSucursalId(e.target.value)}
                disabled={pending}
              >
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
