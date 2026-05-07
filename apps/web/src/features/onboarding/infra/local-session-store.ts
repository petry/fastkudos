import type { Profile } from '@fastkudos/shared';
import type { SessionStore } from '../domain/ports';

const KEY_PREFIX = 'fastkudos:session:';

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

export function localSessionStore(storage: Storage = safeStorage()): SessionStore {
  return {
    save(slug, session) {
      storage.setItem(KEY_PREFIX + slug, JSON.stringify(session));
    },
    load(slug) {
      const raw = storage.getItem(KEY_PREFIX + slug);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as { token: string; profile: Profile };
      } catch {
        storage.removeItem(KEY_PREFIX + slug);
        return null;
      }
    },
  };
}
