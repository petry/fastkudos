import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Profile } from '@fastkudos/shared';
import { OnboardingPage } from './OnboardingPage';
import type { AuthGateway, SessionStore } from '../domain/ports';

function setup(overrides?: { cached?: { token: string; profile: Profile } | null }) {
  const session: SessionStore = {
    save: vi.fn(),
    load: vi.fn(() => overrides?.cached ?? null),
  };
  const auth: AuthGateway = {
    registerAnon: vi.fn(async ({ displayName }) => ({
      token: 'tok',
      profile: { id: 'p1', displayName, eventId: 'e1', isAdmin: false },
    })),
  };
  render(
    <MemoryRouter initialEntries={['/e/demo']}>
      <Routes>
        <Route path="/e/:slug" element={<OnboardingPage auth={auth} session={session} participants={{ list: async () => [] }} kudos={{ submit: vi.fn() }} />} />
      </Routes>
    </MemoryRouter>,
  );
  return { auth, session };
}

describe('<OnboardingPage>', () => {
  it('envia o nome e mostra mensagem de boas-vindas', async () => {
    const user = userEvent.setup();
    const { auth, session } = setup();
    await user.type(screen.getByLabelText('Seu nome'), 'Alice');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(auth.registerAnon).toHaveBeenCalledWith({ slug: 'demo', displayName: 'Alice' });
    expect(session.save).toHaveBeenCalled();
    expect(await screen.findByTestId('welcome')).toHaveTextContent('Olá, Alice!');
  });

  it('mostra mensagem de boas-vindas direto quando há sessão em cache', () => {
    setup({
      cached: { token: 't', profile: { id: 'p1', displayName: 'Bob', eventId: 'e1', isAdmin: false } },
    });
    expect(screen.getByTestId('welcome')).toHaveTextContent('Olá, Bob!');
  });

  it('exibe erro quando o gateway falha', async () => {
    const user = userEvent.setup();
    const session: SessionStore = { save: vi.fn(), load: vi.fn(() => null) };
    const auth: AuthGateway = {
      registerAnon: vi.fn(async () => {
        throw new Error('event_not_found');
      }),
    };
    render(
      <MemoryRouter initialEntries={['/e/demo']}>
        <Routes>
          <Route path="/e/:slug" element={<OnboardingPage auth={auth} session={session} participants={{ list: async () => [] }} kudos={{ submit: vi.fn() }} />} />
        </Routes>
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText('Seu nome'), 'Alice');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/event_not_found/);
  });
});
