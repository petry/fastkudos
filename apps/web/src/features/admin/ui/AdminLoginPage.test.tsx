import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminLoginPage } from './AdminLoginPage';
import type { AdminAuthGateway, AdminSessionStore } from '../domain/ports';

function setup(authImpl?: AdminAuthGateway['login']) {
  const auth: AdminAuthGateway = {
    login:
      authImpl ??
      vi.fn(async ({ email }) => ({ token: 'tok', admin: { id: 'a1', email } })),
  };
  const session: AdminSessionStore = { save: vi.fn(), load: vi.fn(() => null), clear: vi.fn() };
  const onLoggedIn = vi.fn();
  render(<AdminLoginPage auth={auth} session={session} onLoggedIn={onLoggedIn} />);
  return { auth, session, onLoggedIn };
}

describe('<AdminLoginPage>', () => {
  it('faz login, salva sessão e dispara callback', async () => {
    const user = userEvent.setup();
    const { auth, session, onLoggedIn } = setup();
    await user.type(screen.getByLabelText('Email'), 'admin@x.com');
    await user.type(screen.getByLabelText('Senha'), 'segredo');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(auth.login).toHaveBeenCalledWith({ email: 'admin@x.com', password: 'segredo' });
    expect(session.save).toHaveBeenCalled();
    expect(onLoggedIn).toHaveBeenCalled();
  });

  it('mostra erro vindo do gateway', async () => {
    const user = userEvent.setup();
    setup(vi.fn(async () => { throw new Error('invalid_credentials'); }));
    await user.type(screen.getByLabelText('Email'), 'admin@x.com');
    await user.type(screen.getByLabelText('Senha'), 'errada');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('invalid_credentials');
  });
});
