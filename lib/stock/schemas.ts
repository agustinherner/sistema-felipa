import { z } from 'zod';

export const TipoAjusteSchema = z.enum([
  'AJUSTE_ROTURA',
  'AJUSTE_ROBO',
  'AJUSTE_CONTEO',
  'DEVOLUCION',
]);
export type TipoAjuste = z.infer<typeof TipoAjusteSchema>;

export const AjusteSchema = z
  .object({
    varianteId: z.string().min(1, 'Variante requerida'),
    sucursalId: z.string().min(1, 'Sucursal requerida'),
    tipo: TipoAjusteSchema,
    cantidadInput: z
      .number()
      .int('La cantidad debe ser un número entero'),
    motivo: z
      .string()
      .max(500, 'El motivo no puede superar los 500 caracteres')
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === 'AJUSTE_CONTEO') {
      if (data.cantidadInput < 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'La cantidad real contada no puede ser negativa',
          path: ['cantidadInput'],
        });
      }
    } else {
      if (data.cantidadInput < 1) {
        ctx.addIssue({
          code: 'custom',
          message: 'La cantidad debe ser al menos 1',
          path: ['cantidadInput'],
        });
      }
    }
  });

export type AjusteInput = z.infer<typeof AjusteSchema>;

export const IngresoLineaSchema = z.object({
  varianteId: z.string().min(1, 'Variante requerida'),
  cantidad: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad debe ser al menos 1'),
});

export const IngresoBulkSchema = z.object({
  sucursalId: z.string().min(1, 'Sucursal requerida'),
  identificador: z
    .string()
    .max(100, 'Máximo 100 caracteres')
    .nullable()
    .optional(),
  proveedor: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .nullable()
    .optional(),
  observaciones: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .nullable()
    .optional(),
  lineas: z
    .array(IngresoLineaSchema)
    .min(1, 'Agregá al menos una línea'),
});

export type IngresoBulkInput = z.infer<typeof IngresoBulkSchema>;
