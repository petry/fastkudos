import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import logoMark from '../../assets/brand/logo-mark.svg';

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
          <img src={logoMark} alt="" aria-hidden="true" className="h-8 w-8" />
          FastKudos
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">{rightSlot}</div>
      </div>
    </header>
  );
}
