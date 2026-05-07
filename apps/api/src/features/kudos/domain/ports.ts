import type { Feedback } from '@fastkudos/shared';

export interface ProfileLookup {
  findById(id: string): Promise<{ id: string; eventId: string } | null>;
}

export interface FeedbackRepo {
  create(input: {
    senderId: string;
    receiverId: string;
    eventId: string;
    content: string;
  }): Promise<Feedback>;
}

export interface RealtimePublisher {
  publish(eventId: string, payload: { type: 'kudo.created'; feedback: Feedback }): Promise<void>;
}
