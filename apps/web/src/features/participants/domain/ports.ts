import type { Profile } from '@fastkudos/shared';

export interface ParticipantsGateway {
  list(input: { slug: string; token: string }): Promise<Profile[]>;
}
