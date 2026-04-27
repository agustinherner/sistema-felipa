import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { MOCK_AUTH_COOKIE, type Role } from '@/lib/auth/types';

const VALID_ROLES: Role[] = ['admin', 'vendedor'];

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const role = (body as { role?: unknown })?.role;
  if (typeof role !== 'string' || !VALID_ROLES.includes(role as Role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  cookies().set(MOCK_AUTH_COOKIE, role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true, role });
}

export async function DELETE() {
  cookies().delete(MOCK_AUTH_COOKIE);
  return NextResponse.json({ ok: true });
}
