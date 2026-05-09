import { z } from 'zod';

const USERNAME_REGEX = /^[a-z0-9._-]+$/;

const usernameField = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'El usuario debe tener al menos 3 caracteres')
  .max(30, 'El usuario no puede tener más de 30 caracteres')
  .regex(
    USERNAME_REGEX,
    'Solo letras minúsculas, números, puntos, guiones bajos y guiones',
  );

const passwordField = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres');

const nombreField = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres');

const rolField = z.enum(['ADMIN', 'VENDEDOR']);

export const CrearUsuarioSchema = z
  .object({
    nombre: nombreField,
    username: usernameField,
    password: passwordField,
    confirmPassword: z.string(),
    rol: rolField,
    sucursalId: z.string().min(1, 'Elegí una sucursal'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

export type CrearUsuarioInput = z.infer<typeof CrearUsuarioSchema>;

export const EditarUsuarioSchema = z.object({
  userId: z.string().min(1),
  nombre: nombreField,
  rol: rolField,
  sucursalId: z.string().min(1, 'Elegí una sucursal'),
});

export type EditarUsuarioInput = z.infer<typeof EditarUsuarioSchema>;

export const ResetPasswordSchema = z
  .object({
    userId: z.string().min(1),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const ToggleActivoSchema = z.object({
  userId: z.string().min(1),
  activo: z.boolean(),
});

export type ToggleActivoInput = z.infer<typeof ToggleActivoSchema>;
