import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { Feedback, Profile } from '@fastkudos/shared';
import { InboxList } from './InboxList';
import type { InboxGateway } from '../domain/ports';

const fb = (id: string, content: string, senderId = 's'): Feedback => ({
  id,
  createdAt: new Date('2026-05-06T10:00:00Z').toISOString(),
  senderId,
  receiverId: 'me',
  eventId: 'e1',
  content,
});

const profiles = new Map<string, Profile>([
  ['s', { id: 's', displayName: 'Ana', eventId: 'e1', isAdmin: false }],
  ['me', { id: 'me', displayName: 'Eu', eventId: 'e1', isAdmin: false }],
]);

describe('<InboxList>', () => {
  it('exibe feedbacks recebidos com sender visível', async () => {
    const gateway: InboxGateway = {
      list: vi.fn(async () => [fb('1', 'mandou bem!'), fb('2', 'top')]),
    };
    render(<InboxList token="t" gateway={gateway} profilesById={profiles} />);
    await waitFor(() => screen.getByTestId('inbox'));
    expect(screen.getByText('mandou bem!')).toBeInTheDocument();
    expect(screen.getByText('top')).toBeInTheDocument();
    expect(screen.getAllByText('Ana').length).toBeGreaterThan(0);
  });

  it('exibe estado vazio quando não há mensagens', async () => {
    const gateway: InboxGateway = { list: vi.fn(async () => []) };
    render(<InboxList token="t" gateway={gateway} profilesById={profiles} />);
    await waitFor(() => screen.getByText(/caixa está vazia/i));
  });

  it('exibe erro do gateway', async () => {
    const gateway: InboxGateway = {
      list: vi.fn(async () => {
        throw new Error('boom');
      }),
    };
    render(<InboxList token="t" gateway={gateway} profilesById={profiles} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('boom');
  });
});
