import { z } from 'zod';

// Acepta string o number; trim + convierte a number. Los inputs del form vienen
// como string (controlled inputs), por eso preprocesamos.
const numericoOpcional = z.preprocess(
  (v) => {
    if (typeof v === 'string') {
      const t = v.trim();
      if (t === '') return null;
      return Number(t);
    }
    return v;
  },
  z.number({ message: 'Debe ser un número' }),
);

const textoOpcional = z.preprocess(
  (v) => {
    if (typeof v === 'string') {
      const t = v.trim();
      return t === '' ? null : t;
    }
    return v;
  },
  z.string().nullable(),
);

export const ActualizarConfiguracionSchema = z.object({
  nombreNegocio: z
    .string()
    .trim()
    .min(1, 'El nombre del negocio no puede estar vacío')
    .max(120),
  direccion: textoOpcional,
  telefono: textoOpcional,
  cuit: textoOpcional,
  markupDefault: numericoOpcional
    .pipe(z.number().gt(1, 'El multiplicador de markup debe ser mayor a 1'))
    .pipe(z.number().lte(99, 'El multiplicador es demasiado alto')),
  descuentoEstandar: numericoOpcional
    .pipe(z.number().gte(0, 'El descuento no puede ser negativo'))
    .pipe(z.number().lte(100, 'El descuento no puede superar 100%')),
  diasDevolucion: numericoOpcional
    .pipe(z.number().int('Tiene que ser un número entero'))
    .pipe(z.number().gte(0, 'Los días no pueden ser negativos'))
    .pipe(z.number().lte(3650, 'Demasiados días')),
  umbralStockBajo: numericoOpcional
    .pipe(z.number().int('Tiene que ser un número entero'))
    .pipe(z.number().gte(0, 'El umbral no puede ser negativo'))
    .pipe(z.number().lte(10000, 'Umbral demasiado alto')),
});

export type ActualizarConfiguracionInput = z.infer<
  typeof ActualizarConfiguracionSchema
>;

export const CambiarPasswordPropiaSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

export type CambiarPasswordPropiaInput = z.infer<
  typeof CambiarPasswordPropiaSchema
>;
