import { z } from 'zod';

export const slugSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug deve ser kebab-case');

export const eventSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  name: z.string().min(1).max(120),
  slug: slugSchema,
  ownerId: z.string().uuid(),
});

export const createEventInput = z.object({
  name: z.string().min(1).max(120),
  slug: slugSchema,
});

export type Event = z.infer<typeof eventSchema>;
export type CreateEventInput = z.infer<typeof createEventInput>;
