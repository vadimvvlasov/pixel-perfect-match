// Every failure of the API surfaces as one of these, so the UI branches on the class, not on HTTP details.

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** 400: the request was invalid; the message says what is expected. */
export class ValidationError extends ApiError {}
/** 403, or an HTML page instead of JSON (the session expired and something answered with a login page). */
export class AuthRequiredError extends ApiError {}
/** 404: no such job or result (or someone else's). */
export class NotFoundError extends ApiError {}
/** 409 */
export class ConflictError extends ApiError {}
/** 429: too many jobs in progress or per 24 hours. */
export class RateLimitError extends ApiError {}
/** The request did not reach the server, or no answer came. */
export class NetworkError extends ApiError {
  constructor(message = "нет связи с сервером") {
    super(message, 0);
  }
}

const BY_STATUS: Record<number, new (message: string, status: number) => ApiError> = {
  400: ValidationError,
  403: AuthRequiredError,
  404: NotFoundError,
  409: ConflictError,
  429: RateLimitError,
};

export const errorFor = (status: number, message: string): ApiError => new (BY_STATUS[status] ?? ApiError)(message, status);
