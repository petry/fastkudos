import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Event } from '@fastkudos/shared';
import { EventsList } from './EventsList';
import type { OwnedEventsGateway } from '../domain/ports';

function gw(events: Event[] = [], overrides: Partial<OwnedEventsGateway> = {}): OwnedEventsGateway {
  return {
    create: vi.fn(),
    list: vi.fn(async () => events),
    update: vi.fn(),
    delete: vi.fn(),
    feedbacks: vi.fn(async () => []),
    deleteFeedback: vi.fn(),
    profiles: vi.fn(async () => []),
    deleteProfile: vi.fn(),
    ...overrides,
  };
}

describe('<EventsList>', () => {
  it('exibe eventos com link de moderação', async () => {
    const events: Event[] = [
      { id: 'e1', createdAt: new Date().toISOString(), name: 'Demo', slug: 'demo', ownerId: 'a' },
    ];
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <EventsList token="t" gateway={gw(events)} />
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByText('Demo'));
    const link = screen.getByRole('link', { name: /moderar/i });
    expect(link).toHaveAttribute('href', '/dashboard/events/e1');
  });

  it('mostra estado vazio', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <EventsList token="t" gateway={gw([])} />
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByText(/nenhum evento/i));
  });

  describe('apagar evento', () => {
    beforeEach(() => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
    });
    afterEach(() => vi.restoreAllMocks());

    it('apaga e remove da lista após confirmação', async () => {
      const user = userEvent.setup();
      const events: Event[] = [
        { id: 'e1', createdAt: new Date().toISOString(), name: 'Demo', slug: 'demo', ownerId: 'a' },
      ];
      const gateway = gw(events);
      render(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <EventsList token="t" gateway={gateway} />
        </MemoryRouter>,
      );
      await waitFor(() => screen.getByText('Demo'));
      await user.click(screen.getByRole('button', { name: /apagar/i }));
      expect(gateway.delete).toHaveBeenCalledWith({ token: 't', eventId: 'e1' });
      await waitFor(() => expect(screen.queryByText('Demo')).not.toBeInTheDocument());
    });

    it('não apaga quando usuário cancela confirmação', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const user = userEvent.setup();
      const events: Event[] = [
        { id: 'e1', createdAt: new Date().toISOString(), name: 'Demo', slug: 'demo', ownerId: 'a' },
      ];
      const gateway = gw(events);
      render(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <EventsList token="t" gateway={gateway} />
        </MemoryRouter>,
      );
      await waitFor(() => screen.getByText('Demo'));
      await user.click(screen.getByRole('button', { name: /apagar/i }));
      expect(gateway.delete).not.toHaveBeenCalled();
      expect(screen.getByText('Demo')).toBeInTheDocument();
    });
  });

  describe('editar evento', () => {
    it('edita nome e slug e atualiza a lista', async () => {
      const user = userEvent.setup();
      const events: Event[] = [
        { id: 'e1', createdAt: new Date().toISOString(), name: 'Demo', slug: 'demo', ownerId: 'a' },
      ];
      const update = vi.fn(async ({ patch }: { patch: { name?: string; slug?: string } }) => ({
        id: 'e1',
        name: patch.name ?? 'Demo',
        slug: patch.slug ?? 'demo',
      }));
      const gateway = gw(events, { update });
      render(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <EventsList token="t" gateway={gateway} />
        </MemoryRouter>,
      );
      await waitFor(() => screen.getByText('Demo'));
      await user.click(screen.getByRole('button', { name: /editar/i }));

      const nameInput = screen.getByLabelText('Nome do evento');
      const slugInput = screen.getByLabelText('Slug');
      await user.clear(nameInput);
      await user.type(nameInput, 'Renomeado');
      await user.clear(slugInput);
      await user.type(slugInput, 'renomeado');
      await user.click(screen.getByRole('button', { name: /salvar/i }));

      expect(update).toHaveBeenCalledWith({
        token: 't',
        eventId: 'e1',
        patch: { name: 'Renomeado', slug: 'renomeado' },
      });
      await waitFor(() => screen.getByText('Renomeado'));
      expect(screen.getByText('/e/renomeado')).toBeInTheDocument();
    });

    it('rejeita slug inválido localmente sem chamar gateway', async () => {
      const user = userEvent.setup();
      const events: Event[] = [
        { id: 'e1', createdAt: new Date().toISOString(), name: 'Demo', slug: 'demo', ownerId: 'a' },
      ];
      const update = vi.fn();
      const gateway = gw(events, { update });
      render(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <EventsList token="t" gateway={gateway} />
        </MemoryRouter>,
      );
      await waitFor(() => screen.getByText('Demo'));
      await user.click(screen.getByRole('button', { name: /editar/i }));
      const slugInput = screen.getByLabelText('Slug');
      await user.clear(slugInput);
      await user.type(slugInput, 'NÃO VAI');
      await user.click(screen.getByRole('button', { name: /salvar/i }));
      expect(update).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('cancelar volta para visualização sem alterar', async () => {
      const user = userEvent.setup();
      const events: Event[] = [
        { id: 'e1', createdAt: new Date().toISOString(), name: 'Demo', slug: 'demo', ownerId: 'a' },
      ];
      const gateway = gw(events);
      render(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <EventsList token="t" gateway={gateway} />
        </MemoryRouter>,
      );
      await waitFor(() => screen.getByText('Demo'));
      await user.click(screen.getByRole('button', { name: /editar/i }));
      await user.click(screen.getByRole('button', { name: /cancelar/i }));
      expect(gateway.update).not.toHaveBeenCalled();
      expect(screen.queryByLabelText('Nome do evento')).not.toBeInTheDocument();
      expect(screen.getByText('Demo')).toBeInTheDocument();
    });
  });
});
