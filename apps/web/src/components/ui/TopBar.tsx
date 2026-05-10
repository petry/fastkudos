import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export interface TopBarProps {
  rightSlot: ReactNode;
}

export function TopBar({ rightSlot }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-bold tracking-tight text-slate-900 transition hover:text-slate-700"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-rose-500 text-white shadow-sm">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          FastKudos
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">{rightSlot}</div>
      </div>
    </header>
  );
}
