import { verifyPassword } from '../../../auth/password';
import type { AdminUserRepo } from '../domain/ports';

export class InvalidCredentialsError extends Error {}

export interface AdminLoginDeps {
  admins: AdminUserRepo;
  verify?: (password: string, stored: string) => Promise<boolean>;
}

export async function adminLogin(
  deps: AdminLoginDeps,
  cmd: { email: string; password: string },
): Promise<{ adminId: string; email: string }> {
  const verifier = deps.verify ?? verifyPassword;
  const user = await deps.admins.findByEmail(cmd.email.toLowerCase());
  if (!user) throw new InvalidCredentialsError();
  const ok = await verifier(cmd.password, user.passwordHash);
  if (!ok) throw new InvalidCredentialsError();
  return { adminId: user.id, email: user.email };
}
