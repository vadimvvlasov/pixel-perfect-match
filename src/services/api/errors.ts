export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400);
  }
}
export class AuthRequiredError extends ApiError {
  constructor(message = "Access required") {
    super(message, 403);
  }
}
export class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}
export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409);
  }
}
export class RateLimitError extends ApiError {
  constructor(message: string) {
    super(message, 429);
  }
}
export class NetworkError extends ApiError {
  constructor(message = "Network unavailable") {
    super(message, 0);
  }
}
