export interface AdminSession {
  token: string;
  admin: { id: string; email: string };
}

export interface AdminAuthGateway {
  login(input: { email: string; password: string }): Promise<AdminSession>;
}

export interface AdminEventsGateway {
  create(input: { token: string; name: string; slug: string }): Promise<{ id: string; slug: string; name: string }>;
}

export interface AdminSessionStore {
  save(s: AdminSession): void;
  load(): AdminSession | null;
  clear(): void;
}
