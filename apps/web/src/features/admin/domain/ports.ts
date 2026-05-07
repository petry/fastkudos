import type { Event, Feedback, Profile, UserSession } from '@fastkudos/shared';

export interface LoggedSession {
  token: string;
  user: UserSession;
}

export interface LoggedSessionStore {
  save(s: LoggedSession): void;
  load(): LoggedSession | null;
  clear(): void;
}

export interface UserAuthGateway {
  /** Redireciona o browser para o /auth/google/start no backend, com query `redirect`. */
  startGoogleLogin(redirectAfter: string): void;
  /** Busca dados do user logado via JWT (GET /auth/me). */
  fetchMe(token: string): Promise<UserSession>;
}

export interface OwnedEventsGateway {
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
