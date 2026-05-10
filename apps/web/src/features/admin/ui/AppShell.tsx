import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Shield } from 'lucide-react';
import type { UserSession } from '@fastkudos/shared';
import { Avatar } from '../../../components/ui/Avatar';
import { TopBar } from '../../../components/ui/TopBar';

export interface AppShellProps {
  current: UserSession;
  onSignOut: () => void;
  width?: '5xl' | '3xl';
  children: ReactNode;
}

const WIDTH_CLASSES: Record<NonNullable<AppShellProps['width']>, string> = {
  '5xl': 'max-w-5xl',
  '3xl': 'max-w-3xl',
};

export function AppShell({ current, onSignOut, width = '5xl', children }: AppShellProps) {
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
            <Avatar name={current.name} imageUrl={current.avatarUrl} size="sm" />
            {current.role === 'superadmin' && (
              <Link
                to="/superadmin"
                title="Painel superadmin"
                aria-label="Painel superadmin"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:h-auto sm:w-auto sm:gap-2 sm:rounded-full sm:border sm:border-slate-200 sm:bg-white sm:px-3 sm:py-2 sm:text-sm sm:font-medium sm:text-slate-700 sm:hover:bg-slate-50"
              >
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Superadmin</span>
              </Link>
            )}
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Sair</span>
            </button>
          </>
        }
      />

      <main className={`mx-auto ${WIDTH_CLASSES[width]} px-4 py-8 sm:px-6 md:py-10`}>
        {children}
      </main>
    </div>
  );
}
