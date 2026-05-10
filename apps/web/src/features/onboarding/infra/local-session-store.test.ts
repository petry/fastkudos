import { beforeEach, describe, expect, it } from 'vitest';
import type { Profile } from '@fastkudos/shared';
import { localSessionStore } from './local-session-store';

function memoryStorage(): Storage {
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

const profile: Profile = {
  id: 'p1',
  displayName: 'Alice',
  eventId: 'e1',
  isAdmin: false,
  avatarUrl: null,
};

describe('localSessionStore', () => {
  let storage: Storage;
  beforeEach(() => {
    storage = memoryStorage();
  });

  it('save grava e load recupera por slug', () => {
    const store = localSessionStore(storage);
    store.save('demo', { token: 't', profile });
    expect(store.load('demo')).toEqual({ token: 't', profile });
  });

  it('load retorna null para slug sem sessão', () => {
    const store = localSessionStore(storage);
    expect(store.load('demo')).toBeNull();
  });

  it('clear remove a chave do storage', () => {
    const store = localSessionStore(storage);
    store.save('demo', { token: 't', profile });
    store.clear('demo');
    expect(store.load('demo')).toBeNull();
    expect(storage.getItem('fastkudos:session:demo')).toBeNull();
  });

  it('clear de um slug não afeta outros', () => {
    const store = localSessionStore(storage);
    store.save('a', { token: 'ta', profile });
    store.save('b', { token: 'tb', profile });
    store.clear('a');
    expect(store.load('a')).toBeNull();
    expect(store.load('b')).toEqual({ token: 'tb', profile });
  });

  it('load recupera de payload corrompido removendo a chave', () => {
    storage.setItem('fastkudos:session:demo', 'not-json');
    const store = localSessionStore(storage);
    expect(store.load('demo')).toBeNull();
    expect(storage.getItem('fastkudos:session:demo')).toBeNull();
  });
});
