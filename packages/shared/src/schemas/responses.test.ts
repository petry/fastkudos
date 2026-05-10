import { describe, expect, it } from 'vitest';
import {
  authResponse,
  createEventResponse,
  inboxListResponse,
  meResponse,
  meEventFeedbacksResponse,
  meEventProfilesResponse,
  meEventsListResponse,
  muralListResponse,
  participantsListResponse,
  submitKudoResponse,
  updateEventResponse,
} from './responses';

const VALID_FEEDBACK = {
  id: '11111111-1111-1111-1111-111111111111',
  createdAt: '2026-01-02T03:04:05.000Z',
  senderId: '22222222-2222-2222-2222-222222222222',
  receiverId: '33333333-3333-3333-3333-333333333333',
  eventId: '44444444-4444-4444-4444-444444444444',
  content: 'oi',
};

const VALID_PROFILE = {
  id: '11111111-1111-1111-1111-111111111111',
  displayName: 'Ana',
  eventId: '22222222-2222-2222-2222-222222222222',
  isAdmin: false,
  avatarUrl: null,
};

const VALID_EVENT = {
  id: '11111111-1111-1111-1111-111111111111',
  createdAt: '2026-01-02T03:04:05.000Z',
  name: 'Festa',
  slug: 'festa-2026',
  ownerId: '22222222-2222-2222-2222-222222222222',
};

describe('inboxListResponse', () => {
  it('aceita lista de feedbacks', () => {
    expect(inboxListResponse.parse({ feedbacks: [VALID_FEEDBACK] })).toEqual({
      feedbacks: [VALID_FEEDBACK],
    });
  });

  it('aceita lista vazia', () => {
    expect(inboxListResponse.parse({ feedbacks: [] })).toEqual({ feedbacks: [] });
  });

  it('rejeita quando feedbacks ausente', () => {
    expect(() => inboxListResponse.parse({})).toThrow();
  });

  it('rejeita feedback malformado', () => {
    expect(() =>
      inboxListResponse.parse({ feedbacks: [{ ...VALID_FEEDBACK, id: 'not-uuid' }] }),
    ).toThrow();
  });
});

describe('muralListResponse', () => {
  it('aceita lista de feedbacks', () => {
    expect(muralListResponse.parse({ feedbacks: [VALID_FEEDBACK] }).feedbacks).toHaveLength(1);
  });
});

describe('submitKudoResponse', () => {
  it('aceita feedback único', () => {
    expect(submitKudoResponse.parse({ feedback: VALID_FEEDBACK })).toEqual({
      feedback: VALID_FEEDBACK,
    });
  });

  it('rejeita sem feedback', () => {
    expect(() => submitKudoResponse.parse({})).toThrow();
  });
});

describe('participantsListResponse', () => {
  it('aceita event resumo + profiles', () => {
    const event = { id: VALID_EVENT.id, name: VALID_EVENT.name, slug: VALID_EVENT.slug };
    expect(participantsListResponse.parse({ event, profiles: [VALID_PROFILE] })).toEqual({
      event,
      profiles: [VALID_PROFILE],
    });
  });

  it('rejeita slug inválido no event', () => {
    expect(() =>
      participantsListResponse.parse({
        event: { id: VALID_EVENT.id, name: VALID_EVENT.name, slug: 'X' },
        profiles: [],
      }),
    ).toThrow();
  });
});

describe('meEventsListResponse', () => {
  it('aceita lista de events completos', () => {
    expect(meEventsListResponse.parse({ events: [VALID_EVENT] })).toEqual({
      events: [VALID_EVENT],
    });
  });
});

describe('createEventResponse / updateEventResponse', () => {
  it('aceita event básico (id, slug, name)', () => {
    const event = { id: VALID_EVENT.id, slug: VALID_EVENT.slug, name: VALID_EVENT.name };
    expect(createEventResponse.parse({ event })).toEqual({ event });
    expect(updateEventResponse.parse({ event })).toEqual({ event });
  });
});

describe('meEventFeedbacksResponse / meEventProfilesResponse', () => {
  it('aceita listas correspondentes', () => {
    expect(meEventFeedbacksResponse.parse({ feedbacks: [VALID_FEEDBACK] }).feedbacks).toHaveLength(
      1,
    );
    expect(meEventProfilesResponse.parse({ profiles: [VALID_PROFILE] }).profiles).toHaveLength(1);
  });
});

describe('meResponse', () => {
  it('aceita user session válido', () => {
    const user = {
      id: VALID_PROFILE.id,
      email: 'a@b.com',
      name: 'Ana',
      avatarUrl: null,
      role: 'user' as const,
    };
    expect(meResponse.parse({ user })).toEqual({ user });
  });

  it('rejeita role desconhecido', () => {
    expect(() =>
      meResponse.parse({
        user: {
          id: VALID_PROFILE.id,
          email: 'a@b.com',
          name: 'Ana',
          avatarUrl: null,
          role: 'guest',
        },
      }),
    ).toThrow();
  });
});

describe('authResponse (já existente — apenas regressão)', () => {
  it('aceita token + profile reduzido', () => {
    const profile = {
      id: VALID_PROFILE.id,
      displayName: 'Ana',
      eventId: VALID_PROFILE.eventId,
      isAdmin: false,
    };
    expect(authResponse.parse({ token: 'tok', profile })).toEqual({ token: 'tok', profile });
  });
});
