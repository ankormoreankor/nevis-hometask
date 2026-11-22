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

function statusOf(error: unknown): number | undefined {
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
