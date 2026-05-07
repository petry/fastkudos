import { count, desc, eq } from 'drizzle-orm';
import type { Database } from '../../../db/client';
import { users } from '../../../../drizzle/schema';
import type {
  OauthProviderName,
  StoredProvider,
  UserRecord,
  UserRole,
} from '../domain/oauth-profile';
import type { UserRepo } from '../domain/ports';

function rowToRecord(row: typeof users.$inferSelect): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatarUrl,
    role: row.role as UserRole,
    oauthProvider: row.oauthProvider as StoredProvider,
    oauthSub: row.oauthSub,
  };
}

export function userRepo(db: Database): UserRepo {
  return {
    async findById(id) {
      const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
      const row = rows[0];
      return row ? rowToRecord(row) : null;
    },
    async findByProviderSub(provider: OauthProviderName, sub: string) {
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.oauthSub, sub))
        .limit(5);
      const match = rows.find((r) => r.oauthProvider === provider);
      return match ? rowToRecord(match) : null;
    },
    async findByEmail(email) {
      const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const row = rows[0];
      return row ? rowToRecord(row) : null;
    },
    async create(input) {
      const inserted = await db
        .insert(users)
        .values({
          email: input.email,
          name: input.name,
          avatarUrl: input.avatarUrl,
          oauthProvider: input.oauthProvider,
          oauthSub: input.oauthSub,
        })
        .returning();
      return rowToRecord(inserted[0]!);
    },
    async promoteLegacy(id, patch) {
      const updated = await db
        .update(users)
        .set({
          name: patch.name,
          avatarUrl: patch.avatarUrl,
          oauthProvider: patch.oauthProvider,
          oauthSub: patch.oauthSub,
        })
        .where(eq(users.id, id))
        .returning();
      return rowToRecord(updated[0]!);
    },
    async refreshProfile(id, patch) {
      const updated = await db
        .update(users)
        .set({ name: patch.name, avatarUrl: patch.avatarUrl })
        .where(eq(users.id, id))
        .returning();
      return rowToRecord(updated[0]!);
    },
    async listAll() {
      const rows = await db.select().from(users).orderBy(desc(users.createdAt));
      return rows.map(rowToRecord);
    },
    async countSuperadmins() {
      const rows = await db
        .select({ n: count() })
        .from(users)
        .where(eq(users.role, 'superadmin'));
      return Number(rows[0]?.n ?? 0);
    },
    async updateRole(id, role) {
      const updated = await db
        .update(users)
        .set({ role })
        .where(eq(users.id, id))
        .returning();
      return rowToRecord(updated[0]!);
    },
  };
}
