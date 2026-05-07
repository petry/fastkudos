import { describe, expect, it, vi } from 'vitest';
import {
  ForbiddenError,
  NotFoundError,
  deleteFeedbackAsAdmin,
  deleteProfileAsAdmin,
} from './moderate';
import type { FeedbackOwnership, ProfileOwnership } from '../domain/ports';
import type { Actor } from '../domain/actor';

const owner: Actor = { id: 'admin-1', role: 'user' };
const intruder: Actor = { id: 'admin-2', role: 'user' };
const root: Actor = { id: 'super', role: 'superadmin' };

function feedbacks(o: string | null): FeedbackOwnership {
  return { ownerOfFeedback: async () => o, delete: vi.fn() };
}
function profiles(o: string | null): ProfileOwnership {
  return { ownerOfProfile: async () => o, delete: vi.fn() };
}

describe('deleteFeedbackAsAdmin', () => {
  it('apaga quando dono do evento', async () => {
    const repo = feedbacks('admin-1');
    await deleteFeedbackAsAdmin({ feedbacks: repo }, { feedbackId: 'f', actor: owner });
    expect(repo.delete).toHaveBeenCalledWith('f');
  });

  it('superadmin apaga de outro evento', async () => {
    const repo = feedbacks('admin-1');
    await deleteFeedbackAsAdmin({ feedbacks: repo }, { feedbackId: 'f', actor: root });
    expect(repo.delete).toHaveBeenCalledWith('f');
  });

  it('rejeita Forbidden quando outro user', async () => {
    await expect(
      deleteFeedbackAsAdmin({ feedbacks: feedbacks('admin-1') }, { feedbackId: 'f', actor: intruder }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejeita NotFound quando feedback inexistente', async () => {
    await expect(
      deleteFeedbackAsAdmin({ feedbacks: feedbacks(null) }, { feedbackId: 'f', actor: owner }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('deleteProfileAsAdmin', () => {
  it('apaga quando dono', async () => {
    const repo = profiles('admin-1');
    await deleteProfileAsAdmin({ profiles: repo }, { profileId: 'p', actor: owner });
    expect(repo.delete).toHaveBeenCalledWith('p');
  });

  it('superadmin apaga profile de outro evento', async () => {
    const repo = profiles('admin-1');
    await deleteProfileAsAdmin({ profiles: repo }, { profileId: 'p', actor: root });
    expect(repo.delete).toHaveBeenCalledWith('p');
  });

  it('rejeita Forbidden quando outro user', async () => {
    await expect(
      deleteProfileAsAdmin({ profiles: profiles('admin-1') }, { profileId: 'p', actor: intruder }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
