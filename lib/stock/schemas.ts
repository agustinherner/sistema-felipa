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
