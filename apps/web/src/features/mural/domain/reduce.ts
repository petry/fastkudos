import type { Feedback } from '@fastkudos/shared';
import type { MuralEvent } from './types';

const MAX_ITEMS = 100;

export function applyMuralEvent(state: Feedback[], event: MuralEvent): Feedback[] {
  switch (event.type) {
    case 'kudo.created':
      if (state.some((f) => f.id === event.feedback.id)) return state;
      return [event.feedback, ...state]
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
        .slice(0, MAX_ITEMS);
  }
}
