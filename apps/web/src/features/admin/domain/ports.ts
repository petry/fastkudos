export interface AdminSession {
  token: string;
  admin: { id: string; email: string };
}

export interface AdminAuthGateway {
  login(input: { email: string; password: string }): Promise<AdminSession>;
}

import type { Event, Feedback, Profile } from '@fastkudos/shared';

export interface AdminEventsGateway {
  create(input: { token: string; name: string; slug: string }): Promise<{ id: string; slug: string; name: string }>;
  list(input: { token: string }): Promise<Event[]>;
  update(input: {
    token: string;
    eventId: string;
    patch: { name?: string; slug?: string };
  }): Promise<{ id: string; slug: string; name: string }>;
  delete(input: { token: string; eventId: string }): Promise<void>;
  feedbacks(input: { token: string; eventId: string }): Promise<Feedback[]>;
  deleteFeedback(input: { token: string; feedbackId: string }): Promise<void>;
  profiles(input: { token: string; eventId: string }): Promise<Profile[]>;
  deleteProfile(input: { token: string; profileId: string }): Promise<void>;
}

export interface AdminSessionStore {
  save(s: AdminSession): void;
  load(): AdminSession | null;
  clear(): void;
}
