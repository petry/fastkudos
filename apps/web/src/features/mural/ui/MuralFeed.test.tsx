import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import type { Feedback, Profile } from '@fastkudos/shared';
import { MuralFeed } from './MuralFeed';
import type { EventStream } from '../domain/ports';
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

const fb = (id: string, content: string): Feedback => ({
  id,
  createdAt: new Date().toISOString(),
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
  it('renderiza estado vazio inicialmente', () => {
    const { stream } = fakeStream();
    render(<MuralFeed slug="demo" token="t" stream={stream} profilesById={profiles} />);
    expect(screen.getByText(/aguardando o primeiro kudo/i)).toBeInTheDocument();
  });

  it('insere novo kudo no topo quando recebe evento', () => {
    const { stream, emit } = fakeStream();
    render(<MuralFeed slug="demo" token="t" stream={stream} profilesById={profiles} />);
    act(() => emit({ type: 'kudo.created', feedback: fb('1', 'oi') }));
    act(() => emit({ type: 'kudo.created', feedback: fb('2', 'top') }));
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('top');
    expect(items[1]).toHaveTextContent('oi');
  });

  it('mostra sender e receiver do kudo', () => {
    const { stream, emit } = fakeStream();
    render(<MuralFeed slug="demo" token="t" stream={stream} profilesById={profiles} />);
    act(() => emit({ type: 'kudo.created', feedback: fb('1', 'mandou bem') }));
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Bruno')).toBeInTheDocument();
  });
});
