import { describe, expect, it, vi } from 'vitest';
import {
  ForbiddenError,
  NotFoundError,
  deleteFeedbackAsAdmin,
  deleteProfileAsAdmin,
} from './moderate';
import type { FeedbackOwnership, ProfileOwnership } from '../domain/ports';

function feedbacks(owner: string | null): FeedbackOwnership {
  return {
    ownerOfFeedback: async () => owner,
    delete: vi.fn(),
  };
}
function profiles(owner: string | null): ProfileOwnership {
  return {
    ownerOfProfile: async () => owner,
    delete: vi.fn(),
  };
}

describe('deleteFeedbackAsAdmin', () => {
  it('apaga quando admin é dono do evento', async () => {
    const repo = feedbacks('admin-1');
    await deleteFeedbackAsAdmin({ feedbacks: repo }, { feedbackId: 'f', adminId: 'admin-1' });
    expect(repo.delete).toHaveBeenCalledWith('f');
  });

  it('rejeita Forbidden quando outro admin', async () => {
    await expect(
      deleteFeedbackAsAdmin({ feedbacks: feedbacks('admin-X') }, { feedbackId: 'f', adminId: 'admin-1' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejeita NotFound quando feedback inexistente', async () => {
    await expect(
      deleteFeedbackAsAdmin({ feedbacks: feedbacks(null) }, { feedbackId: 'f', adminId: 'admin-1' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('deleteProfileAsAdmin', () => {
  it('apaga quando admin é dono', async () => {
    const repo = profiles('admin-1');
    await deleteProfileAsAdmin({ profiles: repo }, { profileId: 'p', adminId: 'admin-1' });
    expect(repo.delete).toHaveBeenCalledWith('p');
  });

  it('rejeita Forbidden quando outro admin', async () => {
    await expect(
      deleteProfileAsAdmin({ profiles: profiles('admin-X') }, { profileId: 'p', adminId: 'admin-1' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
