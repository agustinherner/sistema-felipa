'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/auth/types';
import { navGroupsForRole } from '@/lib/nav';

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const groups = navGroupsForRole(role);

  return (
    <aside className="flex w-60 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Sistema Felipa
        </Link>
      </div>
      <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {groups.map((group, i) => (
          <Fragment key={group.id}>
            {i > 0 && <Separator className="my-2" />}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Fragment>
        ))}
      </nav>
    </aside>
  );
}
