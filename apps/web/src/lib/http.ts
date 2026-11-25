// 404 is the only status the client branches on.
const NotFoundStatus = 404;

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

// Read by shape and not by instanceof, because Vite gives the class a new
// identity under HMR.
const unreadable = Symbol.for("nevis.http.unreadable");

// The server answered, so the body is final and not worth another try.
export class ResponseError extends Error {
  readonly [unreadable] = true;

  constructor(message: string) {
    super(message);
    this.name = "ResponseError";
  }
}

export function isResponseError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  // SAFETY: The guard above established that error is a non-null object.
  return (error as Record<symbol, unknown>)[unreadable] === true;
}

export function statusOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  // SAFETY: The guard above established a non-null object, and the typeof check below narrows
  // status to a number.
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

export function isNotFound(error: unknown): error is HttpFailure & { status: 404 } {
  return statusOf(error) === NotFoundStatus;
}

// A 4xx and an unreadable body are final, a 5xx and a request with no answer
// are retried.
export function isTransient(error: unknown): boolean {
  if (isResponseError(error)) return false;
  const status = statusOf(error);
  return status === undefined || status >= 500;
}
