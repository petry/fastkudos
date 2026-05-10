import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { handleDomainError } from './error-handler';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from './domain';

function appWithHandler(throwFn: () => never) {
  const app = new Hono();
  app.get('/boom', () => {
    throwFn();
  });
  app.onError(handleDomainError);
  return app;
}

describe('handleDomainError', () => {
  it('NotFoundError → 404 com code', async () => {
    const app = appWithHandler(() => {
      throw new NotFoundError('event_not_found');
    });
    const res = await app.request('http://local/boom');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'event_not_found' });
  });

  it('ForbiddenError → 403 com code default', async () => {
    const app = appWithHandler(() => {
      throw new ForbiddenError();
    });
    const res = await app.request('http://local/boom');
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'forbidden' });
  });

  it('ConflictError → 409 com code', async () => {
    const app = appWithHandler(() => {
      throw new ConflictError('slug_taken');
    });
    const res = await app.request('http://local/boom');
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'slug_taken' });
  });

  it('ValidationError → 400 com issues', async () => {
    const issues = [{ path: ['name'], message: 'obrigatório' }];
    const app = appWithHandler(() => {
      throw new ValidationError('invalid_input', undefined, issues);
    });
    const res = await app.request('http://local/boom');
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_input', issues });
  });

  it('ValidationError sem issues → body sem chave issues', async () => {
    const app = appWithHandler(() => {
      throw new ValidationError('invalid_input');
    });
    const res = await app.request('http://local/boom');
    expect(await res.json()).toEqual({ error: 'invalid_input' });
  });

  it('Error genérico → 500 com error=internal_error', async () => {
    const app = appWithHandler(() => {
      throw new Error('algo explodiu');
    });
    const res = await app.request('http://local/boom');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'internal_error' });
  });
});
