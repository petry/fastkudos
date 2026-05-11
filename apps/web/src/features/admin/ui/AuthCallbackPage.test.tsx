import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthCallbackPage } from './AuthCallbackPage';
import type { UserSession } from '@fastkudos/shared';
import type { LoggedSessionStore, UserAuthGateway } from '../domain/ports';

function setup() {
  const session: LoggedSessionStore = {
    save: vi.fn(),
    load: vi.fn(() => null),
    clear: vi.fn(),
  };
  const auth: UserAuthGateway = {
    startGoogleLogin: vi.fn(),
    // Promise que nunca resolve: simula latência de rede. É exatamente nesse
    // intervalo que o page_view do GA poderia capturar window.location.href.
    fetchMe: vi.fn(() => new Promise<UserSession>(() => undefined)),
  };
  return { session, auth };
}

describe('<AuthCallbackPage>', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/auth/callback#token=secret-jwt&redirect=/dashboard');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('limpa o fragmento da URL sincronamente, antes de aguardar fetchMe', () => {
    const { session, auth } = setup();

    render(
      <MemoryRouter>
        <AuthCallbackPage session={session} auth={auth} />
      </MemoryRouter>,
    );

    // fetchMe está pendente (nunca resolve), simulando latência de rede.
    // Mesmo assim, o token NÃO pode estar mais em window.location.hash —
    // senão um page_view paralelo do GA o capturaria.
    expect(window.location.hash).toBe('');
    expect(window.location.href).not.toContain('secret-jwt');
    expect(auth.fetchMe).toHaveBeenCalledWith('secret-jwt');
  });
});
