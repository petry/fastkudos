import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Feedback, Profile } from '@fastkudos/shared';
import { InboxPage } from './InboxPage';
import type { SessionStore } from '../../onboarding/domain/ports';
import type { ParticipantsGateway } from '../../participants/domain/ports';
import type { InboxGateway } from '../domain/ports';

const me: Profile = { id: 'me', displayName: 'Alice', eventId: 'e1', isAdmin: false };
const sender: Profile = { id: 's', displayName: 'Bob', eventId: 'e1', isAdmin: false };

function setup(opts: {
  cached?: { token: string; profile: Profile } | null;
  feedbacks?: Feedback[];
}) {
  const session: SessionStore = {
    save: vi.fn(),
    load: vi.fn(() => opts.cached ?? null),
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
    <MemoryRouter initialEntries={['/e/demo/inbox']}>
      <Routes>
        <Route
          path="/e/:slug/inbox"
          element={<InboxPage session={session} participants={participants} inbox={inbox} />}
        />
        <Route path="/e/:slug" element={<div data-testid="event-home" />} />
      </Routes>
    </MemoryRouter>,
  );
  return { session, participants, inbox };
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

  it('mostra link Voltar para o evento à esquerda do botão Sair', async () => {
    setup({ cached: { token: 't', profile: me } });
    const back = await screen.findByRole('link', { name: /voltar/i });
    expect(back).toHaveAttribute('href', '/e/demo');
    const leave = screen.getByRole('button', { name: /sair/i });
    expect(back.compareDocumentPosition(leave) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('redireciona para /e/:slug quando não há sessão', async () => {
    setup({ cached: null });
    await waitFor(() => expect(screen.getByTestId('event-home')).toBeInTheDocument());
  });

  it('Sair limpa a sessão e volta para /e/:slug', async () => {
    const user = userEvent.setup();
    const { session } = setup({ cached: { token: 't', profile: me } });
    const leave = await screen.findByRole('button', { name: /sair/i });
    await user.click(leave);
    expect(session.save).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('event-home')).toBeInTheDocument());
  });
});
