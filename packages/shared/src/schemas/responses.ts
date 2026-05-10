import { z } from 'zod';
import { authResponse, userSession } from './auth';
import { eventSchema, slugSchema } from './event';
import { feedbackSchema } from './feedback';
import { profileSchema } from './profile';

const eventSummary = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: slugSchema,
});

const eventBasic = z.object({
  id: z.string().uuid(),
  slug: slugSchema,
  name: z.string().min(1),
});

export const inboxListResponse = z.object({
  feedbacks: z.array(feedbackSchema),
});

export const muralListResponse = z.object({
  feedbacks: z.array(feedbackSchema),
});

export const submitKudoResponse = z.object({
  feedback: feedbackSchema,
});

export const participantsListResponse = z.object({
  event: eventSummary,
  profiles: z.array(profileSchema),
});

export const meEventsListResponse = z.object({
  events: z.array(eventSchema),
});

export const createEventResponse = z.object({
  event: eventBasic,
});

export const updateEventResponse = createEventResponse;

export const meEventFeedbacksResponse = z.object({
  feedbacks: z.array(feedbackSchema),
});

export const meEventProfilesResponse = z.object({
  profiles: z.array(profileSchema),
});

export const meResponse = z.object({
  user: userSession,
});

export { authResponse };

export type EventSummary = z.infer<typeof eventSummary>;
export type EventBasic = z.infer<typeof eventBasic>;
