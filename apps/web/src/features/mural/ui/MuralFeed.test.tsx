import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { Feedback, Profile } from '@fastkudos/shared';
import { MuralFeed } from './MuralFeed';
import type { EventStream, MuralGateway } from '../domain/ports';
import type { MuralEvent } from '../domain/types';

function fakeStream() {
  let emit: (e: MuralEvent) => void = () => {};
  const stream: EventStream = {
    subscribe: (_input, handler) => {
      emit = handler;
      return () => {
        emit = () => {};
      };
    },
  };
  return { stream, emit: (e: MuralEvent) => emit(e) };
}

function fakeGateway(items: Feedback[] = []): MuralGateway {
  return { list: vi.fn(async () => items) };
}

const fb = (id: string, content: string, createdAt = new Date().toISOString()): Feedback => ({
  id,
  createdAt,
  senderId: 's',
  receiverId: 'r',
  eventId: 'e',
  content,
});

const profiles = new Map<string, Profile>([
  ['s', { id: 's', displayName: 'Ana', eventId: 'e', isAdmin: false }],
  ['r', { id: 'r', displayName: 'Bruno', eventId: 'e', isAdmin: false }],
]);

describe('<MuralFeed>', () => {
  it('renderiza estado vazio quando gateway retorna lista vazia', async () => {
    const { stream } = fakeStream();
    render(
      <MuralFeed
        slug="demo"
        token="t"
        stream={stream}
        gateway={fakeGateway([])}
        profilesById={profiles}
      />,
    );
    await waitFor(() =>
      expect(screen.getByText(/aguardando o primeiro kudo/i)).toBeInTheDocument(),
    );
  });

  it('carrega kudos persistidos via gateway no mount (regressão: não sumir após refresh)', async () => {
    const { stream } = fakeStream();
    const past = [
      fb('1', 'persistido-A', '2026-05-07T10:00:00.000Z'),
      fb('2', 'persistido-B', '2026-05-07T11:00:00.000Z'),
    ];
    render(
      <MuralFeed
        slug="demo"
        token="t"
        stream={stream}
        gateway={fakeGateway(past)}
        profilesById={profiles}
      />,
    );
    await waitFor(() => expect(screen.getByText('persistido-A')).toBeInTheDocument());
    expect(screen.getByText('persistido-B')).toBeInTheDocument();
  });

  it('insere novo kudo no topo quando recebe evento', async () => {
    const { stream, emit } = fakeStream();
    render(
      <MuralFeed
        slug="demo"
        token="t"
        stream={stream}
        gateway={fakeGateway([])}
        profilesById={profiles}
      />,
    );
    await waitFor(() =>
      expect(screen.getByText(/aguardando o primeiro kudo/i)).toBeInTheDocument(),
    );
    act(() => emit({ type: 'kudo.created', feedback: fb('1', 'oi', '2026-05-07T10:00:00.000Z') }));
    act(() => emit({ type: 'kudo.created', feedback: fb('2', 'top', '2026-05-07T11:00:00.000Z') }));
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('top');
    expect(items[1]).toHaveTextContent('oi');
  });

  it('mostra sender e receiver do kudo', async () => {
    const { stream, emit } = fakeStream();
    render(
      <MuralFeed
        slug="demo"
        token="t"
        stream={stream}
        gateway={fakeGateway([])}
        profilesById={profiles}
      />,
    );
    await waitFor(() =>
      expect(screen.getByText(/aguardando o primeiro kudo/i)).toBeInTheDocument(),
    );
    act(() => emit({ type: 'kudo.created', feedback: fb('1', 'mandou bem') }));
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Bruno')).toBeInTheDocument();
  });

  it('mescla kudos do gateway com eventos realtime sem duplicar', async () => {
    const { stream, emit } = fakeStream();
    const past = [fb('1', 'antigo', '2026-05-07T10:00:00.000Z')];
    render(
      <MuralFeed
        slug="demo"
        token="t"
        stream={stream}
        gateway={fakeGateway(past)}
        profilesById={profiles}
      />,
    );
    await waitFor(() => expect(screen.getByText('antigo')).toBeInTheDocument());
    act(() =>
      emit({
        type: 'kudo.created',
        feedback: fb('2', 'novo', '2026-05-07T12:00:00.000Z'),
      }),
    );
    act(() =>
      emit({
        type: 'kudo.created',
        feedback: fb('1', 'antigo', '2026-05-07T10:00:00.000Z'),
      }),
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('novo');
    expect(items[1]).toHaveTextContent('antigo');
  });
});
