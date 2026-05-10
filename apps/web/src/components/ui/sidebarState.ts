export const SIDEBAR_KEY = 'fk:sidebar:expanded';

export function loadInitialExpanded(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const v = window.localStorage?.getItem(SIDEBAR_KEY);
    if (v === 'true') return true;
    if (v === 'false') return false;
  } catch {
    /* localStorage indisponível (ex.: storage desabilitado) */
  }
  return window.matchMedia?.('(min-width: 768px)')?.matches ?? true;
}

export function persistExpanded(expanded: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(SIDEBAR_KEY, expanded ? 'true' : 'false');
  } catch {
    /* ignora falhas de storage */
  }
}
