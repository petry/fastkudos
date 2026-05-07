import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Event } from '@fastkudos/shared';
import { EventsList } from './EventsList';
import type { AdminEventsGateway } from '../domain/ports';

function gw(events: Event[] = []): AdminEventsGateway {
  return {
    create: vi.fn(),
    list: vi.fn(async () => events),
    feedbacks: vi.fn(async () => []),
    deleteFeedback: vi.fn(),
    profiles: vi.fn(async () => []),
    deleteProfile: vi.fn(),
  };
}

describe('<EventsList>', () => {
  it('exibe eventos com link de moderação', async () => {
    const events: Event[] = [
      { id: 'e1', createdAt: new Date().toISOString(), name: 'Demo', slug: 'demo', ownerId: 'a' },
    ];
    render(
      <MemoryRouter>
        <EventsList token="t" gateway={gw(events)} />
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByText('Demo'));
    const link = screen.getByRole('link', { name: /moderar/i });
    expect(link).toHaveAttribute('href', '/admin/events/e1');
  });

  it('mostra estado vazio', async () => {
    render(
      <MemoryRouter>
        <EventsList token="t" gateway={gw([])} />
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByText(/nenhum evento/i));
  });
});
