import {
  BarChart3,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from './auth/types';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
};

export type NavGroup = {
  id: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    id: 'ventas',
    items: [
      {
        href: '/nueva-venta',
        label: 'Nueva venta',
        icon: ShoppingCart,
        roles: ['admin', 'vendedor'],
      },
      {
        href: '/ventas',
        label: 'Ventas',
        icon: Receipt,
        roles: ['admin', 'vendedor'],
      },
      {
        href: '/productos',
        label: 'Productos',
        icon: Package,
        roles: ['admin', 'vendedor'],
      },
    ],
  },
  {
    id: 'admin',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        roles: ['admin'],
      },
      {
        href: '/stock',
        label: 'Stock',
        icon: Warehouse,
        roles: ['admin'],
      },
      {
        href: '/reportes',
        label: 'Reportes',
        icon: BarChart3,
        roles: ['admin'],
      },
      {
        href: '/usuarios',
        label: 'Usuarios',
        icon: Users,
        roles: ['admin'],
      },
      {
        href: '/configuracion',
        label: 'Configuración',
        icon: Settings,
        roles: ['admin'],
      },
    ],
  },
];

export function navGroupsForRole(role: Role): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}
