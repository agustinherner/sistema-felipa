import { Rol } from '@prisma/client';
import { requireAuth } from '@/lib/auth/session';
import { obtenerConfiguracion } from '@/lib/configuracion/queries';
import { ConfiguracionAdminForm } from './_components/ConfiguracionAdminForm';
import { MiCuentaForm } from './_components/MiCuentaForm';

export default async function ConfiguracionPage() {
  const user = await requireAuth();
  const esAdmin = user.rol === Rol.ADMIN;

  const config = esAdmin ? await obtenerConfiguracion() : null;

  // Decimal no es serializable cruzando el bound server→client; convertimos a
  // string como ya se hace en /reportes.
  const configSerializada =
    config &&
    ({
      nombreNegocio: config.nombreNegocio,
      direccion: config.direccion,
      telefono: config.telefono,
      cuit: config.cuit,
      markupDefault: config.markupDefault.toString(),
      descuentoEstandar: config.descuentoEstandar.toString(),
      diasDevolucion: config.diasDevolucion,
      umbralStockBajo: config.umbralStockBajo,
    } as const);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          {esAdmin
            ? 'Parámetros del negocio y de tu cuenta.'
            : 'Cambiá la contraseña de tu cuenta.'}
        </p>
      </div>

      {esAdmin && configSerializada && (
        <ConfiguracionAdminForm initial={configSerializada} />
      )}

      <MiCuentaForm />
    </div>
  );
}
