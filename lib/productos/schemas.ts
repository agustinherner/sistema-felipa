import { z } from 'zod';

const trimToNull = (v: unknown) => {
  if (typeof v !== 'string') return v;
  const t = v.trim();
  return t.length === 0 ? null : t;
};

export const VarianteInputSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().trim().min(1, 'El nombre de la variante es requerido'),
  codigoBarras: z.preprocess(trimToNull, z.string().nullable().optional()),
  precio: z
    .number()
    .min(0, 'El precio no puede ser negativo')
    .nullable()
    .optional(),
  costo: z
    .number()
    .min(0, 'El costo no puede ser negativo')
    .nullable()
    .optional(),
  stockInicial: z
    .number()
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo')
    .optional(),
});

export const ProductoInputSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.preprocess(trimToNull, z.string().nullable().optional()),
  categoriaId: z.string().nullable(),
  precioBase: z
    .number()
    .min(0, 'El precio no puede ser negativo')
    .nullable()
    .optional(),
  costoBase: z
    .number()
    .min(0, 'El costo no puede ser negativo')
    .nullable()
    .optional(),
  tieneVariantes: z.boolean(),
  variantes: z.array(VarianteInputSchema).min(1, 'Tiene que haber al menos una variante'),
});

export type VarianteInput = z.infer<typeof VarianteInputSchema>;
export type ProductoInput = z.infer<typeof ProductoInputSchema>;

export const CategoriaInputSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.preprocess(trimToNull, z.string().nullable().optional()),
});

export type CategoriaInput = z.infer<typeof CategoriaInputSchema>;
