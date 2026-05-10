import { describe, expect, it, vi } from 'vitest';
import type { SessionStore } from '../domain/ports';
import type { LoggedSessionStore } from '../../admin/domain/ports';
import { signOutFromEvent } from './sign-out';

function fakeSession(): SessionStore {
  return { save: vi.fn(), load: vi.fn(() => null), clear: vi.fn() };
}

function fakeUserSession(): LoggedSessionStore {
  return { save: vi.fn(), load: vi.fn(() => null), clear: vi.fn() };
}

describe('signOutFromEvent', () => {
  it('limpa a sessão do evento pelo slug', () => {
    const session = fakeSession();
    signOutFromEvent({ session }, 'demo');
    expect(session.clear).toHaveBeenCalledWith('demo');
  });

  it('limpa também a sessão de usuário (Google) quando informada', () => {
    const session = fakeSession();
    const userSession = fakeUserSession();
    signOutFromEvent({ session, userSession }, 'demo');
    expect(session.clear).toHaveBeenCalledWith('demo');
    expect(userSession.clear).toHaveBeenCalled();
  });

  it('é tolerante a userSession ausente (participante anônimo)', () => {
    const session = fakeSession();
    expect(() => signOutFromEvent({ session }, 'demo')).not.toThrow();
    expect(session.clear).toHaveBeenCalledWith('demo');
  });
});
