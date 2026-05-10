import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Profile } from '@fastkudos/shared';
import { EventShell } from './EventShell';

const profile: Profile = {
  id: 'p1',
  displayName: 'Bob',
  eventId: 'e1',
  isAdmin: false,
  avatarUrl: null,
};

function renderShell(overrides: Partial<Parameters<typeof EventShell>[0]> = {}) {
  const onSignOut = vi.fn();
  render(
    <MemoryRouter
      initialEntries={['/e/demo']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <EventShell
        slug="demo"
        profile={profile}
        event={{ id: 'e1', name: 'Demo Day', slug: 'demo' }}
        onSignOut={onSignOut}
        {...overrides}
      >
        <div data-testid="content">conteúdo</div>
      </EventShell>
    </MemoryRouter>,
  );
  return { onSignOut };
}

beforeEach(() => {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() {
        return store.size;
      },
    },
  });
});

describe('<EventShell>', () => {
  it('exibe nome do evento e do participante no header', () => {
    renderShell();
    expect(screen.getByTestId('event-name')).toHaveTextContent('Demo Day');
    expect(screen.getByTestId('welcome')).toHaveTextContent('Bob');
  });

  it('renderiza children no conteúdo principal', () => {
    renderShell();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('sidebar lista Mural e Caixa de recados com hrefs corretos', () => {
    renderShell();
    expect(screen.getByRole('link', { name: /mural/i })).toHaveAttribute('href', '/e/demo');
    expect(screen.getByRole('link', { name: /caixa de recados/i })).toHaveAttribute(
      'href',
      '/e/demo/inbox',
    );
  });

  it('exibe link Moderação quando profile.isAdmin é true', () => {
    renderShell({ profile: { ...profile, isAdmin: true } });
    expect(screen.getByRole('link', { name: /modera[cç][aã]o/i })).toHaveAttribute(
      'href',
      '/e/demo/moderate',
    );
  });

  it('omite link Moderação quando profile.isAdmin é false', () => {
    renderShell();
    expect(screen.queryByRole('link', { name: /modera[cç][aã]o/i })).not.toBeInTheDocument();
  });

  it('exibe link Dashboard como primeiro item quando loggedIn=true', () => {
    renderShell({ loggedIn: true });
    const dashboard = screen.getByRole('link', { name: /^dashboard$/i });
    expect(dashboard).toHaveAttribute('href', '/dashboard');
    const nav = screen.getByRole('navigation');
    const sidebarLinks = within(nav).getAllByRole('link');
    expect(sidebarLinks[0]).toBe(dashboard);
  });

  it('omite link Dashboard quando loggedIn é falso/ausente', () => {
    renderShell();
    expect(screen.queryByRole('link', { name: /^dashboard$/i })).not.toBeInTheDocument();
  });

  it('botão Sair no rodapé do sidebar dispara onSignOut', async () => {
    const user = userEvent.setup();
    const { onSignOut } = renderShell();
    await user.click(screen.getByRole('button', { name: /^sair$/i }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('clicar no avatar (desktop) alterna expanded e persiste em localStorage', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('fk:sidebar:expanded', 'true');
    renderShell();
    const trigger = screen.getByRole('button', { name: /abrir menu de navega/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.click(trigger);
    expect(window.localStorage.getItem('fk:sidebar:expanded')).toBe('false');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
