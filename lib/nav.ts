import {
  BarChart3,
  Clock,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import { Rol } from '@prisma/client';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Rol[];
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
        href: '/ventas/nueva',
        label: 'Nueva venta',
        icon: ShoppingCart,
        roles: [Rol.ADMIN, Rol.VENDEDOR],
      },
      {
        href: '/ventas',
        label: 'Ventas',
        icon: Receipt,
        roles: [Rol.ADMIN, Rol.VENDEDOR],
      },
      {
        href: '/productos',
        label: 'Productos',
        icon: Package,
        roles: [Rol.ADMIN, Rol.VENDEDOR],
      },
      {
        href: '/turno/abrir',
        label: 'Mi turno',
        icon: Clock,
        roles: [Rol.ADMIN, Rol.VENDEDOR],
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
        roles: [Rol.ADMIN],
      },
      {
        href: '/stock',
        label: 'Stock',
        icon: Warehouse,
        roles: [Rol.ADMIN, Rol.VENDEDOR],
      },
      {
        href: '/reportes',
        label: 'Reportes',
        icon: BarChart3,
        roles: [Rol.ADMIN],
      },
      {
        href: '/usuarios',
        label: 'Usuarios',
        icon: Users,
        roles: [Rol.ADMIN],
      },
      {
        href: '/configuracion',
        label: 'Configuración',
        icon: Settings,
        roles: [Rol.ADMIN],
      },
    ],
  },
];

export function navGroupsForRole(rol: Rol): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(rol)),
    }))
    .filter((group) => group.items.length > 0);
}
