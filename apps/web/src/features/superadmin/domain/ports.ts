import type { Event, UserRole } from '@fastkudos/shared';

export interface SuperadminUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  oauthProvider: string;
}

export interface SuperadminGateway {
  listEvents(input: { token: string }): Promise<Event[]>;
  listUsers(input: { token: string }): Promise<SuperadminUser[]>;
  updateUserRole(input: { token: string; userId: string; role: UserRole }): Promise<SuperadminUser>;
}
