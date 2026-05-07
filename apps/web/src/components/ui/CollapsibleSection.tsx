import { useId, useState, type ComponentType, type ReactNode, type SVGProps } from 'react';
import { ChevronDown } from 'lucide-react';

export interface CollapsibleSectionProps {
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  count?: number;
  children: ReactNode;
}

export function CollapsibleSection({ title, icon: Icon, count, children }: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const contentId = useId();

  return (
    <section>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={contentId}
        className="flex w-full items-center gap-2 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-rose-500 text-white shadow-sm">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {count}
          </span>
        )}
        <ChevronDown
          className={`ml-auto h-4 w-4 text-slate-500 transition-transform ${
            expanded ? '' : '-rotate-90'
          }`}
          aria-hidden="true"
        />
      </button>
      {expanded && (
        <div id={contentId} className="mt-3">
          {children}
        </div>
      )}
    </section>
  );
}
