'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import type { Rol } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { navGroupsForRole } from '@/lib/nav';

export function MobileNav({ rol }: { rol: Rol }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const groups = navGroupsForRole(rol);

  // Cerrar el drawer al navegar.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Abrir menú de navegación"
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <SheetTitle className="sr-only">Navegación</SheetTitle>
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-base font-semibold tracking-tight">
            Sistema Felipa
          </span>
        </div>
        <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
          {groups.map((group, i) => (
            <Fragment key={group.id}>
              {i > 0 && <Separator className="my-2" />}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
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
      </SheetContent>
    </Sheet>
  );
}
