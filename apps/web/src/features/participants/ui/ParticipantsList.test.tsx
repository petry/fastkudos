import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Profile } from '@fastkudos/shared';
import { ParticipantsList } from './ParticipantsList';
import type { ParticipantsGateway } from '../domain/ports';

const list: Profile[] = [
  { id: 'me', displayName: 'Eu Mesmo', eventId: 'e', isAdmin: false },
  { id: 'p1', displayName: 'Alice', eventId: 'e', isAdmin: false },
  { id: 'p2', displayName: 'Bob', eventId: 'e', isAdmin: false },
];

function renderWith(gateway: ParticipantsGateway) {
  return render(
    <ParticipantsList slug="demo" token="tok" currentProfileId="me" gateway={gateway} />,
  );
}

describe('<ParticipantsList>', () => {
  it('lista participantes excluindo o próprio usuário', async () => {
    const gateway: ParticipantsGateway = { list: vi.fn(async () => list) };
    renderWith(gateway);
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Eu Mesmo')).not.toBeInTheDocument();
  });

  it('filtra com a busca', async () => {
    const user = userEvent.setup();
    const gateway: ParticipantsGateway = { list: vi.fn(async () => list) };
    renderWith(gateway);
    await waitFor(() => screen.getByText('Alice'));
    await user.type(screen.getByLabelText('Buscar participante'), 'bo');
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('mostra erro quando gateway falha', async () => {
    const gateway: ParticipantsGateway = { list: vi.fn(async () => { throw new Error('boom'); }) };
    renderWith(gateway);
    expect(await screen.findByRole('alert')).toHaveTextContent('boom');
  });
});
