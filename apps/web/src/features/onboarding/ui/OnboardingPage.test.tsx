import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Profile } from '@fastkudos/shared';
import { OnboardingPage } from './OnboardingPage';
import type { AuthGateway, SessionStore } from '../domain/ports';
import type {
  LoggedSession,
  LoggedSessionStore,
  UserAuthGateway,
} from '../../admin/domain/ports';

interface SetupOptions {
  cached?: { token: string; profile: Profile } | null;
  loggedUser?: LoggedSession | null;
  authOverrides?: Partial<AuthGateway>;
}

function setup(opts: SetupOptions = {}) {
  const session: SessionStore = {
    save: vi.fn(),
    load: vi.fn(() => opts.cached ?? null),
    clear: vi.fn(),
  };
  const auth: AuthGateway = {
    registerAnon: vi.fn(async ({ displayName }) => ({
      token: 'tok',
      profile: { id: 'p1', displayName, eventId: 'e1', isAdmin: false, avatarUrl: null },
    })),
    eventJoin: vi.fn(async () => ({
      token: 'tok-user',
      profile: { id: 'p-user', displayName: 'Logado', eventId: 'e1', isAdmin: false, avatarUrl: null },
    })),
    ...opts.authOverrides,
  };
  const userSession: LoggedSessionStore = {
    save: vi.fn(),
    load: vi.fn(() => opts.loggedUser ?? null),
    clear: vi.fn(),
  };
  const userAuth: UserAuthGateway = {
    startGoogleLogin: vi.fn(),
    fetchMe: vi.fn(),
  };
  render(
    <MemoryRouter initialEntries={['/e/demo']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/e/:slug"
          element={
            <OnboardingPage
              auth={auth}
              session={session}
              userSession={userSession}
              userAuth={userAuth}
              participants={{
                list: async () => ({
                  event: { id: 'e1', name: 'Demo', slug: 'demo' },
                  profiles: [],
                }),
              }}
              kudos={{ submit: vi.fn() }}
              stream={{ subscribe: () => () => {} }}
              mural={{ list: async () => [] }}
            />
          }
        />
        <Route path="/" element={<div data-testid="home-page" />} />
      </Routes>
    </MemoryRouter>,
  );
  return { auth, session, userSession, userAuth };
}

const loggedAlice: LoggedSession = {
  token: 'jwt-user-token',
  user: {
    id: 'u1',
    email: 'alice@example.com',
    name: 'Alice Login',
    avatarUrl: null,
    role: 'user',
  },
};

describe('<OnboardingPage> anônimo', () => {
  it('envia o nome e mostra mensagem de boas-vindas', async () => {
    const user = userEvent.setup();
    const { auth, session } = setup();
    await user.type(screen.getByLabelText('Seu nome'), 'Alice');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(auth.registerAnon).toHaveBeenCalledWith({ slug: 'demo', displayName: 'Alice' });
    expect(session.save).toHaveBeenCalled();
    expect(await screen.findByTestId('welcome')).toHaveTextContent('Alice');
  });

  it('mostra mensagem de boas-vindas direto quando há sessão em cache', async () => {
    setup({
      cached: { token: 't', profile: { id: 'p1', displayName: 'Bob', eventId: 'e1', isAdmin: false, avatarUrl: null } },
    });
    await screen.findByText('Demo');
    expect(screen.getByTestId('welcome')).toHaveTextContent('Bob');
  });

  it('exibe o nome do evento no header em vez da URL', async () => {
    setup({
      cached: { token: 't', profile: { id: 'p1', displayName: 'Bob', eventId: 'e1', isAdmin: false, avatarUrl: null } },
    });
    expect(await screen.findByTestId('event-name')).toHaveTextContent('Demo');
    expect(screen.queryByText('/e/demo')).not.toBeInTheDocument();
  });

  it('mostra link Caixa de recados à esquerda do botão Sair', async () => {
    setup({
      cached: { token: 't', profile: { id: 'p1', displayName: 'Bob', eventId: 'e1', isAdmin: false, avatarUrl: null } },
    });
    await screen.findByText('Demo');
    const inboxLink = screen.getByRole('link', { name: /caixa de recados/i });
    expect(inboxLink).toHaveAttribute('href', '/e/demo/inbox');
    const leave = screen.getByRole('button', { name: /sair/i });
    expect(inboxLink.compareDocumentPosition(leave) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('não renderiza a caixa de recados na home do evento', async () => {
    setup({
      cached: { token: 't', profile: { id: 'p1', displayName: 'Bob', eventId: 'e1', isAdmin: false, avatarUrl: null } },
    });
    await screen.findByText('Demo');
    expect(screen.queryByText(/sua caixa de recados/i)).not.toBeInTheDocument();
  });

  it('mostra botão de login Google e dispara startGoogleLogin com redirect do evento', async () => {
    const user = userEvent.setup();
    const { userAuth } = setup();
    const googleBtn = screen.getByRole('button', { name: /continuar com google/i });
    await user.click(googleBtn);
    expect(userAuth.startGoogleLogin).toHaveBeenCalledWith('/e/demo');
  });

  it('exibe erro quando o gateway falha', async () => {
    const user = userEvent.setup();
    const { auth } = setup({
      authOverrides: {
        registerAnon: vi.fn(async () => {
          throw new Error('event_not_found');
        }),
      },
    });
    await user.type(screen.getByLabelText('Seu nome'), 'Alice');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/event_not_found/);
    expect(auth.registerAnon).toHaveBeenCalled();
  });
});

describe('<OnboardingPage> user logado', () => {
  it('faz auto-join silencioso sem renderizar o input de nome', async () => {
    const { auth } = setup({ loggedUser: loggedAlice });
    expect(screen.queryByLabelText('Seu nome')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /continuar com google/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/entrando como alice login/i)).toBeInTheDocument();
    await waitFor(() => expect(auth.eventJoin).toHaveBeenCalledWith({
      slug: 'demo',
      userToken: 'jwt-user-token',
    }));
    expect(await screen.findByTestId('welcome')).toHaveTextContent('Logado');
  });

  it('mostra erro com link de volta quando o auto-join falha', async () => {
    setup({
      loggedUser: loggedAlice,
      authOverrides: {
        eventJoin: vi.fn(async () => {
          throw new Error('event_not_found');
        }),
      },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(/event_not_found/);
    expect(screen.getByRole('link', { name: /voltar para o dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(screen.queryByLabelText('Seu nome')).not.toBeInTheDocument();
  });

  it('quando há sessão anônima em cache, ignora a sessão de user e mostra a UI joined', async () => {
    setup({
      loggedUser: loggedAlice,
      cached: {
        token: 't-anon',
        profile: { id: 'p-anon', displayName: 'Anônimo', eventId: 'e1', isAdmin: false, avatarUrl: null },
      },
    });
    await screen.findByText('Demo');
    expect(screen.getByTestId('welcome')).toHaveTextContent('Anônimo');
  });

  it('Sair limpa a sessão do evento e a sessão Google e leva para /', async () => {
    const user = userEvent.setup();
    const { session, userSession, auth } = setup({
      loggedUser: loggedAlice,
      cached: {
        token: 't-anon',
        profile: { id: 'p-anon', displayName: 'Anônimo', eventId: 'e1', isAdmin: false, avatarUrl: null },
      },
    });
    await screen.findByText('Demo');
    const leave = await screen.findByRole('button', { name: /^sair$/i });
    await user.click(leave);
    expect(session.clear).toHaveBeenCalledWith('demo');
    expect(userSession.clear).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('home-page')).toBeInTheDocument());
    expect(auth.eventJoin).not.toHaveBeenCalled();
  });
});
