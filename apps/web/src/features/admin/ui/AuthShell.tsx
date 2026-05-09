import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-sky-50 via-white to-rose-50 px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-bold tracking-tight text-slate-900 transition hover:text-slate-700"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-rose-500 text-white shadow-sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            FastKudos
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-kudo">
          {children}
        </div>
      </div>
    </main>
  );
}
