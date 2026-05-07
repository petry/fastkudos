import type { AdminSession, AdminSessionStore } from '../domain/ports';

const KEY = 'fastkudos:admin-session';

function safeStorage(): Storage {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const probe = '__fk_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return window.localStorage;
    }
  } catch {
    /* fall through */
  }
  const mem = new Map<string, string>();
  return {
    get length() {
      return mem.size;
    },
    clear: () => mem.clear(),
    key: (i) => Array.from(mem.keys())[i] ?? null,
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => void mem.set(k, v),
    removeItem: (k) => void mem.delete(k),
  };
}

export function localAdminSessionStore(storage: Storage = safeStorage()): AdminSessionStore {
  return {
    save: (s) => storage.setItem(KEY, JSON.stringify(s)),
    load: () => {
      const raw = storage.getItem(KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as AdminSession;
      } catch {
        storage.removeItem(KEY);
        return null;
      }
    },
    clear: () => storage.removeItem(KEY),
  };
}
