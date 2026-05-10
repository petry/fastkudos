import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Feedback, Profile } from '@fastkudos/shared';
import { InboxPage } from './InboxPage';
import type { SessionStore } from '../../onboarding/domain/ports';
import type { LoggedSessionStore } from '../../admin/domain/ports';
import type { ParticipantsGateway } from '../../participants/domain/ports';
import type { InboxGateway } from '../domain/ports';

const me: Profile = { id: 'me', displayName: 'Alice', eventId: 'e1', isAdmin: false, avatarUrl: null };
const sender: Profile = { id: 's', displayName: 'Bob', eventId: 'e1', isAdmin: false, avatarUrl: null };

function setup(opts: {
  cached?: { token: string; profile: Profile } | null;
  feedbacks?: Feedback[];
}) {
  const session: SessionStore = {
    save: vi.fn(),
    load: vi.fn(() => opts.cached ?? null),
    clear: vi.fn(),
  };
  const userSession: LoggedSessionStore = {
    save: vi.fn(),
    load: vi.fn(() => null),
    clear: vi.fn(),
  };
  const participants: ParticipantsGateway = {
    list: vi.fn(async () => ({
      event: { id: 'e1', name: 'Demo', slug: 'demo' },
      profiles: [me, sender],
    })),
  };
  const inbox: InboxGateway = {
    list: vi.fn(async () => opts.feedbacks ?? []),
  };
  render(
    <MemoryRouter initialEntries={['/e/demo/inbox']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/e/:slug/inbox"
          element={
            <InboxPage
              session={session}
              userSession={userSession}
              participants={participants}
              inbox={inbox}
            />
          }
        />
        <Route path="/e/:slug" element={<div data-testid="event-home" />} />
        <Route path="/" element={<div data-testid="home-page" />} />
      </Routes>
    </MemoryRouter>,
  );
  return { session, userSession, participants, inbox };
}

const fb = (id: string, content: string): Feedback => ({
  id,
  createdAt: new Date('2026-05-07T10:00:00Z').toISOString(),
  senderId: 's',
  receiverId: 'me',
  eventId: 'e1',
  content,
});

describe('<InboxPage>', () => {
  it('exibe os feedbacks recebidos pelo usuário logado', async () => {
    setup({ cached: { token: 't', profile: me }, feedbacks: [fb('1', 'mandou bem!')] });
    await waitFor(() => screen.getByTestId('inbox'));
    expect(screen.getByText('mandou bem!')).toBeInTheDocument();
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
  });

  it('mostra o nome do evento no header', async () => {
    setup({ cached: { token: 't', profile: me } });
    expect(await screen.findByTestId('event-name')).toHaveTextContent('Demo');
  });

  it('mostra link Mural no sidebar apontando para a home do evento', async () => {
    setup({ cached: { token: 't', profile: me } });
    const mural = await screen.findByRole('link', { name: /mural/i });
    expect(mural).toHaveAttribute('href', '/e/demo');
    const leave = screen.getByRole('button', { name: /^sair$/i });
    expect(mural.compareDocumentPosition(leave) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('redireciona para /e/:slug quando não há sessão', async () => {
    setup({ cached: null });
    await waitFor(() => expect(screen.getByTestId('event-home')).toBeInTheDocument());
  });

  it('Sair limpa a sessão do evento e a Google e leva para /', async () => {
    const user = userEvent.setup();
    const { session, userSession } = setup({ cached: { token: 't', profile: me } });
    const leave = await screen.findByRole('button', { name: /sair/i });
    await user.click(leave);
    expect(session.clear).toHaveBeenCalledWith('demo');
    expect(userSession.clear).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('home-page')).toBeInTheDocument());
  });
});
