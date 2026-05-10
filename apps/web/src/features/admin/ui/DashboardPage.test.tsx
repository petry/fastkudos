import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import type { LoggedSessionStore, OwnedEventsGateway } from '../domain/ports';

function setup() {
  const session: LoggedSessionStore = {
    save: vi.fn(),
    load: vi.fn(() => ({
      token: 'tok',
      user: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@example.com',
        name: 'Admin',
        avatarUrl: null,
        role: 'user' as const,
      },
    })),
    clear: vi.fn(),
  };
  const events: OwnedEventsGateway = {
    create: vi.fn(),
    list: vi.fn(async () => []),
    update: vi.fn(),
    delete: vi.fn(),
    feedbacks: vi.fn(async () => []),
    deleteFeedback: vi.fn(),
    profiles: vi.fn(async () => []),
    deleteProfile: vi.fn(),
  };
  render(
    <MemoryRouter>
      <DashboardPage session={session} events={events} />
    </MemoryRouter>,
  );
  return { session };
}

describe('<DashboardPage> logout', () => {
  let assign: ReturnType<typeof vi.fn>;
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('limpa sessão e redireciona para / (não para /login)', async () => {
    const user = userEvent.setup();
    const { session } = setup();
    await user.click(screen.getByRole('button', { name: /sair/i }));
    expect(session.clear).toHaveBeenCalled();
    expect(assign).toHaveBeenCalledWith('/');
    expect(assign).not.toHaveBeenCalledWith('/login');
  });
});
