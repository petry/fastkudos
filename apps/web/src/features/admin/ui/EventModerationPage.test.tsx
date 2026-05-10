import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Feedback, Profile } from '@fastkudos/shared';
import { EventModerationPage } from './EventModerationPage';
import type { LoggedSessionStore, OwnedEventsGateway } from '../domain/ports';
import type { SessionStore } from '../../onboarding/domain/ports';
import type { ParticipantsGateway } from '../../participants/domain/ports';

const adminProfile: Profile = {
  id: 'p-admin',
  displayName: 'Admin',
  eventId: 'e1',
  isAdmin: true,
  avatarUrl: null,
};

const memberProfile: Profile = {
  id: 'p-mem',
  displayName: 'Bob',
  eventId: 'e1',
  isAdmin: false,
  avatarUrl: null,
};

const fb = (id: string, content: string): Feedback => ({
  id,
  createdAt: new Date('2026-05-06T10:00:00Z').toISOString(),
  senderId: 'p-mem',
  receiverId: 'p-admin',
  eventId: 'e1',
  content,
});

interface SetupOpts {
  cached?: { token: string; profile: Profile } | null;
  logged?: { token: string } | null;
  feedbacks?: Feedback[];
  profiles?: Profile[];
}

function setup(opts: SetupOpts = {}) {
  const cached = opts.cached === undefined
    ? { token: 'profile-tok', profile: adminProfile }
    : opts.cached;
  const logged =
    opts.logged === undefined ? { token: 'user-tok' } : opts.logged;

  const session: SessionStore = {
    save: vi.fn(),
    load: vi.fn(() => cached),
    clear: vi.fn(),
  };
  const userSession: LoggedSessionStore = {
    save: vi.fn(),
    clear: vi.fn(),
    load: vi.fn(() =>
      logged
        ? {
            token: logged.token,
            user: {
              id: 'u-admin',
              email: 'admin@x',
              name: 'Admin',
              avatarUrl: null,
              role: 'user' as const,
            },
          }
        : null,
    ),
  };
  const participants: ParticipantsGateway = {
    list: vi.fn(async () => ({
      event: { id: 'e1', name: 'Demo Day', slug: 'demo' },
      profiles: [adminProfile, memberProfile],
    })),
  };
  const gateway: OwnedEventsGateway = {
    create: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    feedbacks: vi.fn(async () => opts.feedbacks ?? []),
    deleteFeedback: vi.fn(async () => {}),
    profiles: vi.fn(async () => opts.profiles ?? [adminProfile, memberProfile]),
    deleteProfile: vi.fn(async () => {}),
  };

  render(
    <MemoryRouter
      initialEntries={['/e/demo/moderate']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/e/:slug/moderate"
          element={
            <EventModerationPage
              session={session}
              userSession={userSession}
              participants={participants}
              gateway={gateway}
            />
          }
        />
        <Route path="/e/:slug" element={<div data-testid="event-home" />} />
        <Route path="/login" element={<div data-testid="login-page" />} />
        <Route path="/" element={<div data-testid="home-page" />} />
      </Routes>
    </MemoryRouter>,
  );
  return { session, userSession, participants, gateway };
}

describe('<EventModerationPage>', () => {
  it('redireciona para /e/:slug quando o participante não tem sessão', async () => {
    setup({ cached: null });
    await waitFor(() => expect(screen.getByTestId('event-home')).toBeInTheDocument());
  });

  it('redireciona para /e/:slug quando o participante não é admin', async () => {
    setup({ cached: { token: 'profile-tok', profile: memberProfile } });
    await waitFor(() => expect(screen.getByTestId('event-home')).toBeInTheDocument());
  });

  it('redireciona para /login quando não há sessão de usuário logado', async () => {
    setup({ logged: null });
    await waitFor(() => expect(screen.getByTestId('login-page')).toBeInTheDocument());
  });

  it('renderiza dentro do EventShell com link Moderação no sidebar', async () => {
    setup();
    expect(await screen.findByTestId('event-name')).toHaveTextContent('Demo Day');
    const link = screen.getByRole('link', { name: /modera[cç][aã]o/i });
    expect(link).toHaveAttribute('href', '/e/demo/moderate');
  });

  it('lista feedbacks e remove ao apagar usando o token do user logado', async () => {
    const user = userEvent.setup();
    const { gateway } = setup({ feedbacks: [fb('f1', 'oi'), fb('f2', 'top')] });
    await waitFor(() => screen.getByText('oi'));
    expect(gateway.feedbacks).toHaveBeenCalledWith({ token: 'user-tok', eventId: 'e1' });
    const buttons = screen.getAllByRole('button', { name: /apagar/i });
    await user.click(buttons[0]!);
    expect(gateway.deleteFeedback).toHaveBeenCalledWith({
      token: 'user-tok',
      feedbackId: 'f1',
    });
    await waitFor(() => expect(screen.queryByText('oi')).not.toBeInTheDocument());
    expect(screen.getByText('top')).toBeInTheDocument();
  });

  it('lista participantes e remove com o token do user logado', async () => {
    const user = userEvent.setup();
    const { gateway } = setup();
    await waitFor(() => screen.getByText('Bob'));
    const remove = screen
      .getAllByRole('button', { name: /remover/i })
      .find((b) => b.closest('li')?.textContent?.includes('Bob'));
    expect(remove).toBeDefined();
    await user.click(remove!);
    expect(gateway.deleteProfile).toHaveBeenCalledWith({
      token: 'user-tok',
      profileId: 'p-mem',
    });
    await waitFor(() => expect(screen.queryByText('Bob')).not.toBeInTheDocument());
  });

  it('Sair limpa a sessão de participante e a Google e leva para /', async () => {
    const user = userEvent.setup();
    const { session, userSession } = setup();
    const leave = await screen.findByRole('button', { name: /^sair$/i });
    await user.click(leave);
    expect(session.clear).toHaveBeenCalledWith('demo');
    expect(userSession.clear).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('home-page')).toBeInTheDocument());
  });
});
