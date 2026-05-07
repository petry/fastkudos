import type { Feedback } from '@fastkudos/shared';

export interface InboxGateway {
  list(input: { token: string }): Promise<Feedback[]>;
}
