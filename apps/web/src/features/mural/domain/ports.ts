import type { MuralEvent } from './types';

export interface EventStream {
  subscribe(input: { slug: string; token: string }, handler: (e: MuralEvent) => void): () => void;
}
