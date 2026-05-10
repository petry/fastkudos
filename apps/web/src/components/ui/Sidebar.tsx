import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react';

export type SidebarIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface SidebarItem {
  to: string;
  label: string;
  icon: SidebarIcon;
  /** Casa apenas a rota exata (default: false → casa por prefixo). */
  end?: boolean;
}

export interface SidebarProps {
  items: SidebarItem[];
  /** Conteúdo no rodapé do sidebar (ex: botão Sair). */
  footer?: ReactNode;
  expanded: boolean;
  onToggleExpanded: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  ariaLabel?: string;
}

function isActive(pathname: string, item: SidebarItem) {
  return item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function Sidebar({
  items,
  footer,
  expanded,
  onToggleExpanded,
  mobileOpen,
  onMobileClose,
  ariaLabel = 'Navegação',
}: SidebarProps) {
  const { pathname } = useLocation();

  const railWidth = expanded ? 'md:w-56' : 'md:w-16';

  return (
    <>
      {mobileOpen && (
        <div
          aria-hidden="true"
          onClick={onMobileClose}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        aria-label={ariaLabel}
        className={[
          // mobile: drawer fixo da esquerda
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-100 bg-white transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          // desktop: rail sticky, sem overlay
          'md:sticky md:top-[57px] md:z-0 md:h-[calc(100vh-57px)] md:translate-x-0 md:transition-[width] md:duration-200',
          railWidth,
        ].join(' ')}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-3 py-3 md:hidden">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Menu
            </span>
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Fechar menu"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-2 py-3">
            {items.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onMobileClose}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  title={!expanded ? item.label : undefined}
                  className={[
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                    active
                      ? 'bg-gradient-to-r from-sky-50 to-rose-50 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  ].join(' ')}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-gradient-to-b from-sky-500 to-rose-500"
                    />
                  )}
                  <span
                    className={[
                      'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition',
                      active
                        ? 'bg-gradient-to-br from-sky-500 to-rose-500 text-white shadow-sm'
                        : 'text-slate-500 group-hover:text-slate-700',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span
                    className={[
                      'truncate transition-opacity',
                      expanded ? 'opacity-100' : 'opacity-100 md:hidden',
                    ].join(' ')}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {footer && (
            <div className="border-t border-slate-100 px-2 py-3">{footer}</div>
          )}

          <button
            type="button"
            onClick={onToggleExpanded}
            aria-label={expanded ? 'Recolher menu' : 'Expandir menu'}
            aria-expanded={expanded}
            className="hidden items-center justify-center gap-2 border-t border-slate-100 px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 md:inline-flex"
          >
            {expanded ? (
              <>
                <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
                <span>Recolher</span>
              </>
            ) : (
              <ChevronsRight className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
