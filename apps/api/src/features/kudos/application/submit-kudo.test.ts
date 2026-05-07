import { describe, expect, it } from 'vitest';
import type { Feedback } from '@fastkudos/shared';
import { AuthorizationError, NotFoundError, submitKudo } from './submit-kudo';
import type { FeedbackRepo, ProfileLookup, RealtimePublisher } from '../domain/ports';

function makeDeps(overrides?: {
  profiles?: Partial<ProfileLookup>;
  feedbacks?: Partial<FeedbackRepo>;
  realtime?: Partial<RealtimePublisher>;
}) {
  const created: Feedback[] = [];
  const published: Array<{ eventId: string; payload: unknown }> = [];

  const profiles: ProfileLookup = {
    findById: overrides?.profiles?.findById ??
      (async (id) => ({ id, eventId: 'event-1' })),
  };
  const feedbacks: FeedbackRepo = {
    create: overrides?.feedbacks?.create ??
      (async (input) => {
        const fb: Feedback = {
          id: '00000000-0000-0000-0000-000000000001',
          createdAt: new Date().toISOString(),
          ...input,
        };
        created.push(fb);
        return fb;
      }),
  };
  const realtime: RealtimePublisher = {
    publish: async (eventId, payload) => {
      published.push({ eventId, payload });
    },
  };
  return { deps: { profiles, feedbacks, realtime }, created, published };
}

describe('submitKudo', () => {
  it('cria feedback e publica no canal do evento', async () => {
    const { deps, created, published } = makeDeps();
    const fb = await submitKudo(deps, {
      senderId: 's1',
      senderEventId: 'event-1',
      receiverId: 'r1',
      content: 'mandou bem!',
    });
    expect(fb.content).toBe('mandou bem!');
    expect(created).toHaveLength(1);
    expect(published[0]?.eventId).toBe('event-1');
  });

  it('rejeita kudo para si mesmo', async () => {
    const { deps } = makeDeps();
    await expect(
      submitKudo(deps, {
        senderId: 'x',
        senderEventId: 'event-1',
        receiverId: 'x',
        content: 'oi',
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it('rejeita kudo cross-event (autorização)', async () => {
    const { deps } = makeDeps({
      profiles: { findById: async () => ({ id: 'r1', eventId: 'event-OUTRO' }) },
    });
    await expect(
      submitKudo(deps, {
        senderId: 's1',
        senderEventId: 'event-1',
        receiverId: 'r1',
        content: 'oi',
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it('rejeita destinatário inexistente', async () => {
    const { deps } = makeDeps({ profiles: { findById: async () => null } });
    await expect(
      submitKudo(deps, {
        senderId: 's1',
        senderEventId: 'event-1',
        receiverId: 'r1',
        content: 'oi',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejeita conteúdo vazio (validação de domínio)', async () => {
    const { deps } = makeDeps();
    await expect(
      submitKudo(deps, {
        senderId: 's1',
        senderEventId: 'event-1',
        receiverId: 'r1',
        content: '   ',
      }),
    ).rejects.toThrow();
  });
});
