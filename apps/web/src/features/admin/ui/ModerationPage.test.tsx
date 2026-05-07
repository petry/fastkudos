import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Feedback, Profile } from '@fastkudos/shared';
import { ModerationPage } from './ModerationPage';
import type { LoggedSessionStore, OwnedEventsGateway } from '../domain/ports';

const fb = (id: string, content: string): Feedback => ({
  id,
  createdAt: new Date('2026-05-06T10:00:00Z').toISOString(),
  senderId: 's',
  receiverId: 'r',
  eventId: 'e1',
  content,
});

const profile = (id: string, displayName: string): Profile => ({
  id,
  displayName,
  eventId: 'e1',
  isAdmin: false,
});

function setup(opts?: { feedbacks?: Feedback[]; profiles?: Profile[] }) {
  const gateway: OwnedEventsGateway = {
    create: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    feedbacks: vi.fn(async () => opts?.feedbacks ?? []),
    deleteFeedback: vi.fn(async () => {}),
    profiles: vi.fn(async () => opts?.profiles ?? []),
    deleteProfile: vi.fn(async () => {}),
  };
  const session: LoggedSessionStore = {
    save: vi.fn(),
    load: vi.fn(() => ({
      token: 'tok',
      user: {
        id: 'a1',
        email: 'admin@x',
        name: 'Admin',
        avatarUrl: null,
        role: 'user' as const,
      },
    })),
    clear: vi.fn(),
  };
  render(
    <MemoryRouter initialEntries={['/dashboard/events/e1']}>
      <Routes>
        <Route
          path="/dashboard/events/:id"
          element={<ModerationPage session={session} gateway={gateway} />}
        />
      </Routes>
    </MemoryRouter>,
  );
  return { gateway };
}

describe('<ModerationPage> feedbacks', () => {
  it('lista feedbacks e remove ao apagar', async () => {
    const user = userEvent.setup();
    const { gateway } = setup({ feedbacks: [fb('f1', 'oi'), fb('f2', 'top')] });
    await waitFor(() => screen.getByText('oi'));
    const buttons = screen.getAllByRole('button', { name: /apagar/i });
    await user.click(buttons[0]!);
    expect(gateway.deleteFeedback).toHaveBeenCalledWith({ token: 'tok', feedbackId: 'f1' });
    await waitFor(() => expect(screen.queryByText('oi')).not.toBeInTheDocument());
    expect(screen.getByText('top')).toBeInTheDocument();
  });

  it('mostra estado vazio quando não há feedbacks', async () => {
    setup({ feedbacks: [] });
    await waitFor(() => screen.getByText(/nenhum feedback ainda/i));
  });
});

describe('<ModerationPage> profiles', () => {
  it('lista profiles e remove ao clicar Remover', async () => {
    const user = userEvent.setup();
    const { gateway } = setup({
      profiles: [profile('p1', 'Alice'), profile('p2', 'Bob')],
    });
    await waitFor(() => screen.getByText('Alice'));
    const buttons = screen.getAllByRole('button', { name: /remover/i });
    await user.click(buttons[0]!);
    expect(gateway.deleteProfile).toHaveBeenCalledWith({ token: 'tok', profileId: 'p1' });
    await waitFor(() => expect(screen.queryByText('Alice')).not.toBeInTheDocument());
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('mostra estado vazio quando não há participantes', async () => {
    setup({ profiles: [] });
    await waitFor(() => screen.getByText(/sem participantes/i));
  });
});
