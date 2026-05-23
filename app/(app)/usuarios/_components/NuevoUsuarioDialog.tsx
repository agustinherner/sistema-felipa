'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { crearUsuario } from '@/lib/usuarios/actions';
import type { SucursalOpcion } from '@/lib/usuarios/queries';
import { Rol } from '@prisma/client';

export function NuevoUsuarioDialog({
  open,
  onOpenChange,
  sucursales,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sucursales: SucursalOpcion[];
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rol, setRol] = useState<Rol>(Rol.VENDEDOR);
  const [sucursalId, setSucursalId] = useState(sucursales[0]?.id ?? '');
  const [errores, setErrores] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  function reset() {
    setNombre('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setRol(Rol.VENDEDOR);
    setSucursalId(sucursales[0]?.id ?? '');
    setErrores([]);
    setPending(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrores([]);
    setPending(true);

    const res = await crearUsuario({
      nombre,
      username: username.trim().toLowerCase(),
      password,
      confirmPassword,
      rol,
      sucursalId,
    });

    if (!res.ok) {
      setErrores(res.errores);
      setPending(false);
      return;
    }

    router.refresh();
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>
            El usuario va a poder ingresar con su nombre de usuario y la
            contraseña que le asignes.
          </DialogDescription>
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

          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={pending}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))
              }
              required
              disabled={pending}
              placeholder="andrea"
              autoCapitalize="off"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={pending}
                minLength={8}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm">Confirmar</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={pending}
                minLength={8}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="rol">Rol</Label>
              <Select
                id="rol"
                value={rol}
                onChange={(e) => setRol(e.target.value as Rol)}
                disabled={pending}
              >
                <option value="VENDEDOR">Vendedor</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sucursal">Sucursal</Label>
              <Select
                id="sucursal"
                value={sucursalId}
                onChange={(e) => setSucursalId(e.target.value)}
                disabled={pending || sucursales.length === 0}
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
              onClick={() => handleOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Creando…' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
