import { z } from 'zod';
import { displayNameSchema } from './profile';
import { slugSchema } from './event';

export const anonAuthInput = z.object({
  slug: slugSchema,
  displayName: displayNameSchema,
});

export const adminLoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
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

export type AnonAuthInput = z.infer<typeof anonAuthInput>;
export type AdminLoginInput = z.infer<typeof adminLoginInput>;
export type AuthResponse = z.infer<typeof authResponse>;
