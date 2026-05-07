import type { Feedback } from '@fastkudos/shared';
import type { MuralEvent } from './types';

export interface EventStream {
  subscribe(input: { slug: string; token: string }, handler: (e: MuralEvent) => void): () => void;
}

export interface MuralGateway {
  list(input: { token: string }): Promise<Feedback[]>;
}
