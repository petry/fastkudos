import { displayNameSchema, type Profile } from '@fastkudos/shared';
import type { EventLookup, ProfileRepo, TokenIssuer } from '../domain/ports';

export class NotFoundError extends Error {}

export interface RegisterAnonDeps {
  events: EventLookup;
  profiles: ProfileRepo;
  tokens: TokenIssuer;
}

export interface RegisterAnonCommand {
  slug: string;
  displayName: string;
}

export interface RegisterAnonResult {
  token: string;
  profile: Profile;
}

export async function registerAnonParticipant(
  deps: RegisterAnonDeps,
  cmd: RegisterAnonCommand,
): Promise<RegisterAnonResult> {
  const displayName = displayNameSchema.parse(cmd.displayName);

  const event = await deps.events.findBySlug(cmd.slug);
  if (!event) throw new NotFoundError('evento não encontrado');

  const profile = await deps.profiles.create({ displayName, eventId: event.id });
  const token = await deps.tokens.issueAnon({
    profileId: profile.id,
    eventId: profile.eventId,
    displayName: profile.displayName,
  });

  return { token, profile };
}
