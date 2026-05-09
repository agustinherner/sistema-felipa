import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { username } from 'better-auth/plugins';
import { prisma } from '@/lib/db';

export const ACCOUNT_DISABLED_MESSAGE =
  'Tu cuenta está deshabilitada. Contactá al administrador.';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  // El plugin username permite login por usuario; el sign-up programatico
  // sigue exigiendo email, por eso usamos sintetico `<user>@felipa.local`.
  user: {
    fields: {
      name: 'nombre',
      createdAt: 'creadoEn',
      updatedAt: 'actualizadoEn',
    },
    additionalFields: {
      rol: {
        type: 'string',
        required: false,
        defaultValue: 'VENDEDOR',
        input: false,
      },
      activo: {
        type: 'boolean',
        required: false,
        defaultValue: true,
        input: false,
      },
      sucursalId: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const u = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { activo: true },
          });
          if (u && !u.activo) {
            throw new APIError('FORBIDDEN', {
              message: ACCOUNT_DISABLED_MESSAGE,
            });
          }
        },
      },
    },
  },
  plugins: [username(), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type User = (typeof auth.$Infer.Session)['user'];
