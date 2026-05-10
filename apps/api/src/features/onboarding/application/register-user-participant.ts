import type { Profile } from '@fastkudos/shared';
import type { EventLookup, ProfileRepo, TokenIssuer, UserLookup } from '../domain/ports';
import { NotFoundError } from './register-anon';

export interface RegisterUserDeps {
  events: EventLookup;
  profiles: ProfileRepo;
  users: UserLookup;
  tokens: TokenIssuer;
}

export interface RegisterUserCommand {
  slug: string;
  userId: string;
}

export interface RegisterUserResult {
  token: string;
  profile: Profile;
}

export async function registerUserParticipant(
  deps: RegisterUserDeps,
  cmd: RegisterUserCommand,
): Promise<RegisterUserResult> {
  const event = await deps.events.findBySlug(cmd.slug);
  if (!event) throw new NotFoundError('evento não encontrado');

  const user = await deps.users.findById(cmd.userId);
  if (!user) throw new NotFoundError('user não encontrado');

  const profile = await deps.profiles.findOrCreateForUser({
    userId: user.id,
    eventId: event.id,
    displayName: user.name,
    isAdmin: event.ownerId === user.id,
  });

  const token = await deps.tokens.issueAnon({
    profileId: profile.id,
    eventId: profile.eventId,
    displayName: profile.displayName,
  });

  return { token, profile };
}

export { NotFoundError };
