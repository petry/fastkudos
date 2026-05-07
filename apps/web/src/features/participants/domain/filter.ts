import type { Profile } from '@fastkudos/shared';

export function filterParticipants(participants: Profile[], query: string): Profile[] {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return participants;
  return participants.filter((p) => p.displayName.toLocaleLowerCase().includes(q));
}
