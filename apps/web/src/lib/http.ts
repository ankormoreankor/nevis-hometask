export const HttpStatuses = {
  BadRequest: 400,
  NotFound: 404,
  ServerError: 500,
} as const;

export type HttpStatus = (typeof HttpStatuses)[keyof typeof HttpStatuses];

interface HttpFailure {
  readonly status: number;
  readonly body: string;
}

export class ApiError extends Error implements HttpFailure {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * A failure in the client's own reading of the response: a body that is not
 * JSON, or a body that does not match the contract. The server did answer,
 * so the answer is final and the request is not worth another try.
 *
 * The marker is read by shape and not by instanceof, for the same reason the
 * guards below are: Vite gives the class a new identity under HMR while SWR
 * still holds the old error.
 */
export class ResponseError extends Error {
  readonly unreadable = true;

  constructor(message: string) {
    super(message);
    this.name = "ResponseError";
  }
}

function isResponseError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  return (error as { unreadable?: unknown }).unreadable === true;
}

export function statusOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

export function isBadRequest(
  error: unknown,
): error is HttpFailure & { status: typeof HttpStatuses.BadRequest } {
  return statusOf(error) === HttpStatuses.BadRequest;
}

export function isNotFound(
  error: unknown,
): error is HttpFailure & { status: typeof HttpStatuses.NotFound } {
  return statusOf(error) === HttpStatuses.NotFound;
}

export function isServerError(error: unknown): error is HttpFailure & { status: number } {
  const status = statusOf(error);
  return status !== undefined && status >= 500;
}

/**
 * Whether the failure is worth another try.
 *
 * A response the server meant is final. A 400 for a malformed year and a 404
 * for a fiscal year with no data come back the same way every time, so
 * retrying them only spends requests. A 5xx may be transient, and so may be
 * a request that never got an answer, so both get another try. A body the
 * client could not read is final as well: the server answered, and the same
 * body will come back.
 */
export function isTransient(error: unknown): boolean {
  if (isResponseError(error)) return false;
  const status = statusOf(error);
  return status === undefined || status >= 500;
}
