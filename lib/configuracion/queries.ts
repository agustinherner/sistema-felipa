import { cache } from 'react';
import { Prisma, type Configuracion } from '@prisma/client';
import { prisma } from '@/lib/db';

export const CONFIGURACION_ID = 'singleton';

/**
 * Defaults canónicos de la configuración. ÚNICA fuente de verdad: si el row
 * singleton no existe, lo creamos con estos valores. Coinciden exactamente
 * con los hardcodes que el sistema usaba antes del cableado, así un deploy
 * en una DB sin row se comporta igual que antes.
 */
export const CONFIGURACION_DEFAULTS = {
  nombreNegocio: 'Felipa 1',
  direccion: null as string | null,
  telefono: null as string | null,
  cuit: null as string | null,
  markupDefault: '2.15',
  descuentoEstandar: '10',
  diasDevolucion: 30,
  umbralStockBajo: 3,
} as const;

/**
 * Lee el row singleton de Configuración. Si no existe (DB recién migrada sin
 * seed, o seed parcial), lo crea con los defaults — get-or-create. Dedupeado
 * per-request via React cache().
 */
export const obtenerConfiguracion = cache(async (): Promise<Configuracion> => {
  // upsert es atómico: si dos requests concurrentes encuentran el row vacío,
  // uno crea y el otro recibe el ya creado, sin race ni P2002.
  return prisma.configuracion.upsert({
    where: { id: CONFIGURACION_ID },
    update: {},
    create: {
      id: CONFIGURACION_ID,
      nombreNegocio: CONFIGURACION_DEFAULTS.nombreNegocio,
      direccion: CONFIGURACION_DEFAULTS.direccion,
      telefono: CONFIGURACION_DEFAULTS.telefono,
      cuit: CONFIGURACION_DEFAULTS.cuit,
      markupDefault: new Prisma.Decimal(CONFIGURACION_DEFAULTS.markupDefault),
      descuentoEstandar: new Prisma.Decimal(
        CONFIGURACION_DEFAULTS.descuentoEstandar,
      ),
      diasDevolucion: CONFIGURACION_DEFAULTS.diasDevolucion,
      umbralStockBajo: CONFIGURACION_DEFAULTS.umbralStockBajo,
    },
  });
});
