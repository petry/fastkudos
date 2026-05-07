import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Profile } from '@fastkudos/shared';
import { ParticipantsList } from './ParticipantsList';

const list: Profile[] = [
  { id: 'me', displayName: 'Eu Mesmo', eventId: 'e', isAdmin: false },
  { id: 'p1', displayName: 'Alice', eventId: 'e', isAdmin: false },
  { id: 'p2', displayName: 'Bob', eventId: 'e', isAdmin: false },
];

function renderWith(profiles: Profile[]) {
  return render(
    <ParticipantsList
      token="tok"
      currentProfileId="me"
      profiles={profiles}
      kudos={{ submit: vi.fn() }}
    />,
  );
}

describe('<ParticipantsList>', () => {
  it('lista participantes excluindo o próprio usuário', () => {
    renderWith(list);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Eu Mesmo')).not.toBeInTheDocument();
  });

  it('filtra com a busca', async () => {
    const user = userEvent.setup();
    renderWith(list);
    await user.type(screen.getByLabelText('Buscar participante'), 'bo');
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('mostra estado vazio quando não há outros participantes', () => {
    renderWith([{ id: 'me', displayName: 'Eu Mesmo', eventId: 'e', isAdmin: false }]);
    expect(screen.getByText(/nenhum participante/i)).toBeInTheDocument();
  });
});
