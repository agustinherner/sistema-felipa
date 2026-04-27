import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MOCK_AUTH_COOKIE, type MockUser, type Role } from './types';

const MOCK_USERS: Record<Role, MockUser> = {
  admin: { name: 'Felipa', role: 'admin' },
  vendedor: { name: 'Andrea', role: 'vendedor' },
};

export async function getMockUser(): Promise<MockUser | null> {
  const value = cookies().get(MOCK_AUTH_COOKIE)?.value;
  if (value === 'admin' || value === 'vendedor') {
    return MOCK_USERS[value];
  }
  return null;
}

export async function requireAuth(allowedRoles?: Role[]): Promise<MockUser> {
  const user = await getMockUser();
  if (!user) {
    redirect('/login');
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect('/');
  }
  return user;
}
