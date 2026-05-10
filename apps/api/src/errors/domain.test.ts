import { describe, expect, it } from 'vitest';
import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  isDomainError,
} from './domain';

describe('DomainError', () => {
  it('expõe code, status e mensagem', () => {
    const e = new DomainError('boom', 418, 'eu sou um bule');
    expect(e).toBeInstanceOf(Error);
    expect(e.code).toBe('boom');
    expect(e.status).toBe(418);
    expect(e.message).toBe('eu sou um bule');
  });

  it('usa o code como mensagem padrão', () => {
    expect(new DomainError('boom', 500).message).toBe('boom');
  });
});

describe('NotFoundError', () => {
  it('status 404 com code customizado', () => {
    const e = new NotFoundError('event_not_found');
    expect(e).toBeInstanceOf(DomainError);
    expect(e).toBeInstanceOf(NotFoundError);
    expect(e.status).toBe(404);
    expect(e.code).toBe('event_not_found');
  });

  it('default code é "not_found"', () => {
    expect(new NotFoundError().code).toBe('not_found');
  });
});

describe('ForbiddenError', () => {
  it('status 403 com code default "forbidden"', () => {
    const e = new ForbiddenError();
    expect(e).toBeInstanceOf(DomainError);
    expect(e.status).toBe(403);
    expect(e.code).toBe('forbidden');
  });

  it('aceita code customizado', () => {
    expect(new ForbiddenError('cross_event').code).toBe('cross_event');
  });
});

describe('ConflictError', () => {
  it('status 409', () => {
    const e = new ConflictError('slug_taken');
    expect(e).toBeInstanceOf(DomainError);
    expect(e.status).toBe(409);
    expect(e.code).toBe('slug_taken');
  });
});

describe('ValidationError', () => {
  it('status 400 com issues opcionais', () => {
    const issues = [{ path: ['x'], message: 'oi' }];
    const e = new ValidationError('invalid_input', undefined, issues);
    expect(e.status).toBe(400);
    expect(e.code).toBe('invalid_input');
    expect(e.issues).toEqual(issues);
  });
});

describe('isDomainError', () => {
  it('reconhece subclasses', () => {
    expect(isDomainError(new NotFoundError('x'))).toBe(true);
    expect(isDomainError(new ForbiddenError())).toBe(true);
  });

  it('rejeita Error genérico', () => {
    expect(isDomainError(new Error('boom'))).toBe(false);
    expect(isDomainError('string')).toBe(false);
    expect(isDomainError(null)).toBe(false);
  });
});
