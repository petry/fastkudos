import type { FeedbackOwnership, ProfileOwnership } from '../domain/ports';
import type { Actor } from '../domain/actor';

export class NotFoundError extends Error {}
export class ForbiddenError extends Error {}

export async function deleteFeedbackAsAdmin(
  deps: { feedbacks: FeedbackOwnership },
  cmd: { feedbackId: string; actor: Actor },
): Promise<void> {
  const owner = await deps.feedbacks.ownerOfFeedback(cmd.feedbackId);
  if (owner === null) throw new NotFoundError();
  if (cmd.actor.role !== 'superadmin' && owner !== cmd.actor.id) throw new ForbiddenError();
  await deps.feedbacks.delete(cmd.feedbackId);
}

export async function deleteProfileAsAdmin(
  deps: { profiles: ProfileOwnership },
  cmd: { profileId: string; actor: Actor },
): Promise<void> {
  const owner = await deps.profiles.ownerOfProfile(cmd.profileId);
  if (owner === null) throw new NotFoundError();
  if (cmd.actor.role !== 'superadmin' && owner !== cmd.actor.id) throw new ForbiddenError();
  await deps.profiles.delete(cmd.profileId);
}
