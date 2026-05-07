import { z } from 'zod';

export const KUDO_MAX_LENGTH = 500;

export const kudoContentSchema = z
  .string()
  .trim()
  .min(1, 'mensagem não pode ser vazia')
  .max(KUDO_MAX_LENGTH, `mensagem deve ter no máximo ${KUDO_MAX_LENGTH} caracteres`);

export const feedbackSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  eventId: z.string().uuid(),
  content: kudoContentSchema,
});

export const submitKudoInput = z.object({
  receiverId: z.string().uuid(),
  content: kudoContentSchema,
});

export type Feedback = z.infer<typeof feedbackSchema>;
export type SubmitKudoInput = z.infer<typeof submitKudoInput>;
