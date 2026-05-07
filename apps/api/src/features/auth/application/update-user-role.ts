import type { UserRecord, UserRole } from '../domain/oauth-profile';
import type { UserRepo } from '../domain/ports';

export class NotFoundError extends Error {}
export class LastSuperadminError extends Error {}

export async function updateUserRole(
  deps: { users: UserRepo },
  cmd: { userId: string; role: UserRole },
): Promise<UserRecord> {
  const target = await deps.users.findById(cmd.userId);
  if (!target) throw new NotFoundError();
  if (target.role === cmd.role) return target;

  if (target.role === 'superadmin' && cmd.role === 'user') {
    const total = await deps.users.countSuperadmins();
    if (total <= 1) throw new LastSuperadminError();
  }

  return deps.users.updateRole(cmd.userId, cmd.role);
}
