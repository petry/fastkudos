import type { FeedbackOwnership, ProfileOwnership } from '../domain/ports';

export class NotFoundError extends Error {}
export class ForbiddenError extends Error {}

export async function deleteFeedbackAsAdmin(
  deps: { feedbacks: FeedbackOwnership },
  cmd: { feedbackId: string; adminId: string },
): Promise<void> {
  const owner = await deps.feedbacks.ownerOfFeedback(cmd.feedbackId);
  if (owner === null) throw new NotFoundError();
  if (owner !== cmd.adminId) throw new ForbiddenError();
  await deps.feedbacks.delete(cmd.feedbackId);
}

export async function deleteProfileAsAdmin(
  deps: { profiles: ProfileOwnership },
  cmd: { profileId: string; adminId: string },
): Promise<void> {
  const owner = await deps.profiles.ownerOfProfile(cmd.profileId);
  if (owner === null) throw new NotFoundError();
  if (owner !== cmd.adminId) throw new ForbiddenError();
  await deps.profiles.delete(cmd.profileId);
}
