import type { Profile } from '@fastkudos/shared';

export interface EventSummary {
  id: string;
  name: string;
  slug: string;
}

export interface ParticipantsGateway {
  list(input: {
    slug: string;
    token: string;
  }): Promise<{ event: EventSummary; profiles: Profile[] }>;
}
