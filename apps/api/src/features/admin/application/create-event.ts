import { createEventInput } from '@fastkudos/shared';
import type { EventRepo } from '../domain/ports';

export class SlugTakenError extends Error {}

export interface CreateEventDeps {
  events: EventRepo;
}

export async function createEvent(
  deps: CreateEventDeps,
  cmd: { name: string; slug: string; ownerId: string },
): Promise<{ id: string; slug: string; name: string }> {
  const data = createEventInput.parse({ name: cmd.name, slug: cmd.slug });
  if (await deps.events.existsBySlug(data.slug)) throw new SlugTakenError();
  return deps.events.create({ name: data.name, slug: data.slug, ownerId: cmd.ownerId });
}
