import type { ComponentType, SVGProps } from 'react';

export interface SectionHeaderProps {
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  count?: number;
}

export function SectionHeader({ title, icon: Icon, count }: SectionHeaderProps) {
  return (
    <header className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-rose-500 text-white shadow-sm">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {count !== undefined && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {count}
        </span>
      )}
    </header>
  );
}
