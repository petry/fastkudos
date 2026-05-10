import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from './analytics';

export function usePageViewTracking(): void {
  const { pathname, search } = useLocation();
  useEffect(() => {
    trackPageView(normalizePath(pathname) + search);
  }, [pathname, search]);
}

function normalizePath(pathname: string): string {
  const eventMatch = pathname.match(/^\/e\/[^/]+(\/.*)?$/);
  if (eventMatch) return `/e/[slug]${eventMatch[1] ?? ''}`;
  return pathname;
}
