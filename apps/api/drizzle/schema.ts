import { sql } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: ['user', 'superadmin'] }).notNull().default('user'),
  oauthProvider: text('oauth_provider', { enum: ['google', 'legacy'] }).notNull(),
  oauthSub: text('oauth_sub').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex('users_email_idx').on(t.email),
  providerSubIdx: uniqueIndex('users_provider_sub_idx').on(t.oauthProvider, t.oauthSub),
}));

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (t) => ({
  slugIdx: uniqueIndex('events_slug_idx').on(t.slug),
}));

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  displayName: text('display_name').notNull(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  eventIdx: index('profiles_event_idx').on(t.eventId),
  userEventIdx: uniqueIndex('profiles_user_event_idx').on(t.userId, t.eventId),
}));

export const feedbacks = pgTable('feedbacks', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  senderId: uuid('sender_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  receiverId: uuid('receiver_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
}, (t) => ({
  eventCreatedIdx: index('feedbacks_event_created_idx').on(t.eventId, sql`${t.createdAt} desc`),
}));
