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

  static fromResponse(status: number, body: ApiErrorResponse): ApiError {
    return new ApiError(status, body.error.message, body.error.details);
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
}
