export class DomainError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message?: string,
  ) {
    super(message ?? code);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(code = 'not_found', message?: string) {
    super(code, 404, message);
  }
}

export class ForbiddenError extends DomainError {
  constructor(code = 'forbidden', message?: string) {
    super(code, 403, message);
  }
}

export class ConflictError extends DomainError {
  constructor(code: string, message?: string) {
    super(code, 409, message);
  }
}

export class ValidationError extends DomainError {
  constructor(
    code = 'invalid_input',
    message?: string,
    public readonly issues?: unknown,
  ) {
    super(code, 400, message);
  }
}

export function isDomainError(value: unknown): value is DomainError {
  return value instanceof DomainError;
}
