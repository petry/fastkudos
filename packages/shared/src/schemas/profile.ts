import { z } from 'zod';

export const displayNameSchema = z.string().trim().min(1).max(60);

export const profileSchema = z.object({
  id: z.string().uuid(),
  displayName: displayNameSchema,
  eventId: z.string().uuid(),
  isAdmin: z.boolean(),
});

export type Profile = z.infer<typeof profileSchema>;
