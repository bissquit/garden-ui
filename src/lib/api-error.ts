export interface ApiErrorResponse {
  error: {
    message: string;
    details?: string;
  };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromResponse(status: number, body: unknown, fallbackMessage = 'Request failed'): ApiError {
    const errorBody = body as { error?: { message?: string; details?: string } } | undefined;
    const message = errorBody?.error?.message ?? fallbackMessage;
    const details = errorBody?.error?.details;
    return new ApiError(status, message, details);
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidationError(): boolean {
    return this.status === 400;
  }

  get isUnprocessableEntity(): boolean {
    return this.status === 422;
  }

  get isTooManyRequests(): boolean {
    return this.status === 429;
  }
}
