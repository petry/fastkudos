import type { EventSummary, Profile } from '@fastkudos/shared';

export type { EventSummary };

export interface ParticipantsGateway {
  list(input: {
    slug: string;
    token: string;
  }): Promise<{ event: EventSummary; profiles: Profile[] }>;
}
