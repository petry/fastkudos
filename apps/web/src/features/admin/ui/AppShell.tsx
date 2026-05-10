import { useEffect, useState, type ReactNode } from 'react';
import { LayoutDashboard, LogOut, Shield } from 'lucide-react';
import type { UserSession } from '@fastkudos/shared';
import { Avatar } from '../../../components/ui/Avatar';
import { TopBar } from '../../../components/ui/TopBar';
import { Sidebar, type SidebarItem } from '../../../components/ui/Sidebar';
import { loadInitialExpanded, persistExpanded } from '../../../components/ui/sidebarState';

export interface AppShellProps {
  current: UserSession;
  onSignOut: () => void;
  children: ReactNode;
}

export function AppShell({ current, onSignOut, children }: AppShellProps) {
  const [expanded, setExpanded] = useState<boolean>(loadInitialExpanded);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    persistExpanded(expanded);
  }, [expanded]);

  const items: SidebarItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ...(current.role === 'superadmin'
      ? [{ to: '/superadmin', label: 'Superadmin', icon: Shield }]
      : []),
  ];

  const handleAvatarClick = () => {
    const isDesktop = window.matchMedia?.('(min-width: 768px)')?.matches ?? true;
    if (isDesktop) {
      setExpanded((v) => !v);
    } else {
      setMobileOpen((v) => !v);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/40">
      <TopBar
        rightSlot={
          <>
            <div className="hidden text-right text-xs leading-tight sm:block">
              <p className="font-medium text-slate-800">{current.name}</p>
              <p className="text-slate-500">
                {current.role === 'superadmin' ? 'superadmin' : current.email}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAvatarClick}
              aria-label="Abrir menu de navegação"
              aria-expanded={expanded || mobileOpen}
              className="rounded-full transition-transform duration-150 hover:scale-105 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              <Avatar name={current.name} imageUrl={current.avatarUrl} size="sm" />
            </button>
          </>
        }
      />

      <div className="mx-auto flex w-full max-w-7xl">
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 md:py-10">{children}</main>

        <Sidebar
          items={items}
          expanded={expanded}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          footer={
            <button
              type="button"
              onClick={onSignOut}
              aria-label="Sair"
              title={!expanded ? 'Sair' : undefined}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </span>
              <span
                className={[
                  'truncate',
                  expanded ? 'opacity-100' : 'opacity-100 md:hidden',
                ].join(' ')}
              >
                Sair
              </span>
            </button>
          }
        />
      </div>
    </div>
  );
}
