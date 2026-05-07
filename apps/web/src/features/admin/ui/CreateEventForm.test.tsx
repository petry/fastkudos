import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateEventForm } from './CreateEventForm';
import type { OwnedEventsGateway } from '../domain/ports';

function setup(impl?: OwnedEventsGateway['create']) {
  const gateway: OwnedEventsGateway = {
    create: impl ?? vi.fn(async ({ name, slug }) => ({ id: 'e1', name, slug })),
    list: vi.fn(async () => []),
    update: vi.fn(),
    delete: vi.fn(),
    feedbacks: vi.fn(async () => []),
    deleteFeedback: vi.fn(),
    profiles: vi.fn(async () => []),
    deleteProfile: vi.fn(),
  };
  render(<CreateEventForm token="tok" gateway={gateway} />);
  return { gateway };
}

describe('<CreateEventForm>', () => {
  it('cria evento e mostra confirmação', async () => {
    const user = userEvent.setup();
    const { gateway } = setup();
    await user.type(screen.getByLabelText('Nome do evento'), 'Demo');
    await user.type(screen.getByLabelText('Slug'), 'demo');
    await user.click(screen.getByRole('button', { name: /criar/i }));
    expect(gateway.create).toHaveBeenCalledWith({ token: 'tok', name: 'Demo', slug: 'demo' });
    expect(await screen.findByRole('status')).toHaveTextContent('/e/demo');
  });

  it('rejeita slug inválido localmente sem chamar gateway', async () => {
    const user = userEvent.setup();
    const { gateway } = setup();
    await user.type(screen.getByLabelText('Nome do evento'), 'Demo');
    await user.type(screen.getByLabelText('Slug'), 'NÃO VALIDO');
    await user.click(screen.getByRole('button', { name: /criar/i }));
    expect(gateway.create).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('mostra erro de slug duplicado vindo do gateway', async () => {
    const user = userEvent.setup();
    setup(vi.fn(async () => { throw new Error('slug_taken'); }));
    await user.type(screen.getByLabelText('Nome do evento'), 'Demo');
    await user.type(screen.getByLabelText('Slug'), 'demo');
    await user.click(screen.getByRole('button', { name: /criar/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('slug_taken');
  });
});
