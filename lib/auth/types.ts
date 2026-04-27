export type Role = 'admin' | 'vendedor';

export type MockUser = {
  name: string;
  role: Role;
};

export const MOCK_AUTH_COOKIE = 'felipa-mock-role';
