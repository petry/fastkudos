import type { Feedback } from '@fastkudos/shared';

export interface KudosGateway {
  submit(input: { token: string; receiverId: string; content: string }): Promise<Feedback>;
}
