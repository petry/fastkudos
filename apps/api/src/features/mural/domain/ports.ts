import type { Feedback } from '@fastkudos/shared';

export interface MuralRepo {
  listByEvent(eventId: string): Promise<Feedback[]>;
}
