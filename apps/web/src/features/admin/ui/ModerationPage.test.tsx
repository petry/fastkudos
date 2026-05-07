import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Feedback } from '@fastkudos/shared';
import { ModerationPage } from './ModerationPage';
import type { AdminEventsGateway, AdminSessionStore } from '../domain/ports';

const fb = (id: string, content: string): Feedback => ({
  id,
  createdAt: new Date('2026-05-06T10:00:00Z').toISOString(),
  senderId: 's',
  receiverId: 'r',
  eventId: 'e1',
  content,
});

function setup(items: Feedback[]) {
  const gateway: AdminEventsGateway = {
    create: vi.fn(),
    list: vi.fn(),
    feedbacks: vi.fn(async () => items),
    deleteFeedback: vi.fn(async () => {}),
  };
  const session: AdminSessionStore = {
    save: vi.fn(),
    load: vi.fn(() => ({ token: 'tok', admin: { id: 'a1', email: 'admin@x' } })),
    clear: vi.fn(),
  };
  render(
    <MemoryRouter initialEntries={['/admin/events/e1']}>
      <Routes>
        <Route path="/admin/events/:id" element={<ModerationPage session={session} gateway={gateway} />} />
      </Routes>
    </MemoryRouter>,
  );
  return { gateway };
}

describe('<ModerationPage>', () => {
  it('lista feedbacks e remove ao apagar', async () => {
    const user = userEvent.setup();
    const { gateway } = setup([fb('f1', 'oi'), fb('f2', 'top')]);
    await waitFor(() => screen.getByText('oi'));
    const buttons = screen.getAllByRole('button', { name: /apagar/i });
    await user.click(buttons[0]!);
    expect(gateway.deleteFeedback).toHaveBeenCalledWith({ token: 'tok', feedbackId: 'f1' });
    await waitFor(() => expect(screen.queryByText('oi')).not.toBeInTheDocument());
    expect(screen.getByText('top')).toBeInTheDocument();
  });

  it('mostra estado vazio quando não há feedbacks', async () => {
    setup([]);
    await waitFor(() => screen.getByText(/nenhum feedback ainda/i));
  });
});
