import type { ErrorHandler } from 'hono';
import { ValidationError, isDomainError } from './domain';

export const handleDomainError: ErrorHandler = (err, c) => {
  if (isDomainError(err)) {
    const body: { error: string; issues?: unknown } = { error: err.code };
    if (err instanceof ValidationError && err.issues !== undefined) {
      body.issues = err.issues;
    }
    return c.json(body, err.status as 400 | 403 | 404 | 409);
  }
  console.error('[unhandled]', err);
  return c.json({ error: 'internal_error' }, 500);
};
