import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { act } from 'react';
import type { Feedback } from '@fastkudos/shared';
import { useKudoToasts } from './useKudoToasts';
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

const fb = (id: string, receiverId: string, content = 'oi'): Feedback => ({
  id,
  createdAt: new Date().toISOString(),
  senderId: 's',
  receiverId,
  eventId: 'e',
  content,
});

function Harness({
  stream,
  notify,
  myProfileId,
}: {
  stream: EventStream;
  notify: (m: string) => void;
  myProfileId: string;
}) {
  useKudoToasts({ slug: 'demo', token: 't', myProfileId, stream, notify });
  return null;
}

describe('useKudoToasts', () => {
  it('dispara notify quando kudo chega para o user', () => {
    const { stream, emit } = fakeStream();
    const notify = vi.fn();
    render(<Harness stream={stream} notify={notify} myProfileId="me" />);
    act(() => emit({ type: 'kudo.created', feedback: fb('1', 'me', 'mandou bem!') }));
    expect(notify).toHaveBeenCalledWith('Você recebeu um kudo: "mandou bem!"');
  });

  it('ignora kudos para outros usuários', () => {
    const { stream, emit } = fakeStream();
    const notify = vi.fn();
    render(<Harness stream={stream} notify={notify} myProfileId="me" />);
    act(() => emit({ type: 'kudo.created', feedback: fb('1', 'someone-else') }));
    expect(notify).not.toHaveBeenCalled();
  });

  it('cancela inscrição ao desmontar', () => {
    const unsubscribe = vi.fn();
    const stream: EventStream = {
      subscribe: () => unsubscribe,
    };
    const { unmount } = render(
      <Harness stream={stream} notify={vi.fn()} myProfileId="me" />,
    );
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
