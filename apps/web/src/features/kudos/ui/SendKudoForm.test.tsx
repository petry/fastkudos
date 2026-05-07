import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Feedback } from '@fastkudos/shared';
import { SendKudoForm } from './SendKudoForm';
import type { KudosGateway } from '../domain/ports';

const receiver = { id: 'r1', displayName: 'Bob' };

function makeGateway(impl?: KudosGateway['submit']) {
  const submit =
    impl ??
    (vi.fn(async ({ content, receiverId }) => ({
      id: 'f1',
      createdAt: new Date().toISOString(),
      senderId: 's1',
      receiverId,
      eventId: 'e1',
      content,
    } satisfies Feedback)));
  return { submit } as KudosGateway;
}

describe('<SendKudoForm>', () => {
  it('envia mensagem ao gateway e dispara onSent', async () => {
    const user = userEvent.setup();
    const gateway = makeGateway();
    const onSent = vi.fn();
    render(<SendKudoForm receiver={receiver} token="tok" gateway={gateway} onSent={onSent} />);
    await user.type(screen.getByLabelText('Mensagem'), 'mandou bem!');
    await user.click(screen.getByRole('button', { name: /enviar/i }));
    expect(gateway.submit).toHaveBeenCalledWith({
      token: 'tok',
      receiverId: 'r1',
      content: 'mandou bem!',
    });
    expect(onSent).toHaveBeenCalled();
  });

  it('bloqueia envio com mensagem vazia (validação local)', async () => {
    const user = userEvent.setup();
    const gateway = makeGateway();
    render(<SendKudoForm receiver={receiver} token="tok" gateway={gateway} />);
    await user.type(screen.getByLabelText('Mensagem'), '   ');
    await user.click(screen.getByRole('button', { name: /enviar/i }));
    expect(gateway.submit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('mostra erro vindo do gateway', async () => {
    const user = userEvent.setup();
    const gateway = makeGateway(async () => {
      throw new Error('forbidden');
    });
    render(<SendKudoForm receiver={receiver} token="tok" gateway={gateway} />);
    await user.type(screen.getByLabelText('Mensagem'), 'oi');
    await user.click(screen.getByRole('button', { name: /enviar/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('forbidden');
  });
});
