import { z } from 'zod';
import { displayNameSchema } from './profile';
import { slugSchema } from './event';

export const anonAuthInput = z.object({
  slug: slugSchema,
  displayName: displayNameSchema,
});

export const eventJoinInput = z.object({
  slug: slugSchema,
});

export const authResponse = z.object({
  token: z.string(),
  profile: z.object({
    id: z.string().uuid(),
    displayName: z.string(),
    eventId: z.string().uuid(),
    isAdmin: z.boolean(),
  }),
});

export const userRole = z.enum(['user', 'superadmin']);

export const userSession = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  role: userRole,
});

export type AnonAuthInput = z.infer<typeof anonAuthInput>;
export type EventJoinInput = z.infer<typeof eventJoinInput>;
export type AuthResponse = z.infer<typeof authResponse>;
export type UserRole = z.infer<typeof userRole>;
export type UserSession = z.infer<typeof userSession>;
