import { useEffect, useState, type ReactNode } from 'react';
import { LayoutDashboard, LogOut, MessageCircle, Shield, Sparkles } from 'lucide-react';
import type { Profile } from '@fastkudos/shared';
import type { EventSummary } from '../../participants/domain/ports';
import { Avatar } from '../../../components/ui/Avatar';
import { TopBar } from '../../../components/ui/TopBar';
import { Sidebar, type SidebarItem } from '../../../components/ui/Sidebar';
import { loadInitialExpanded, persistExpanded } from '../../../components/ui/sidebarState';
import { trackEvent } from '../../../lib/analytics';

export interface EventShellProps {
  slug: string;
  profile: Profile;
  event: EventSummary | null;
  onSignOut: () => void;
  /** Quando verdadeiro (usuário logado via rede social), mostra link Dashboard como primeiro item da sidebar. */
  loggedIn?: boolean;
  children: ReactNode;
}

export function EventShell({
  slug,
  profile,
  event,
  onSignOut,
  loggedIn = false,
  children,
}: EventShellProps) {
  const [expanded, setExpanded] = useState<boolean>(loadInitialExpanded);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    persistExpanded(expanded);
  }, [expanded]);

  const items: SidebarItem[] = [
    ...(loggedIn
      ? [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true }]
      : []),
    { to: `/e/${slug}`, label: 'Mural', icon: Sparkles, end: true },
    { to: `/e/${slug}/inbox`, label: 'Caixa de recados', icon: MessageCircle },
    ...(profile.isAdmin
      ? [{ to: `/e/${slug}/moderate`, label: 'Moderação', icon: Shield }]
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
              <p data-testid="event-name" className="font-medium text-slate-800">
                {event?.name ?? '…'}
              </p>
              <p data-testid="welcome" className="text-slate-500">
                {profile.displayName}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAvatarClick}
              aria-label="Abrir menu de navegação"
              aria-expanded={expanded || mobileOpen}
              className="rounded-full transition-transform duration-150 hover:scale-105 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              <Avatar name={profile.displayName} imageUrl={profile.avatarUrl} size="sm" />
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
              onClick={() => {
                trackEvent('event_exit', { event_slug: slug });
                onSignOut();
              }}
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
