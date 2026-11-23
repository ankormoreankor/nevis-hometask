/**
 * TASK: Export isResponseError and use a globally registered symbol for ResponseError
 *
 * Goal
 *   Provide HTTP error classification and status extraction helpers for the client data layer.
 *
 * Contract
 *   - ApiError: class extending Error, implements HttpFailure (status: number, body: string).
 *   - ResponseError: class extending Error, marked with Symbol.for("nevis.http.unreadable").
 *   - export function isResponseError(error: unknown): boolean
 *   - export function statusOf(error: unknown): number | undefined
 *   - export function isNotFound(error: unknown): error is HttpFailure & { status: 404 }
 *   - export function isTransient(error: unknown): boolean
 *
 * Changes
 *   1. Replace `const unreadable = Symbol("unreadable");` with
 *      `const unreadable = Symbol.for("nevis.http.unreadable");`.
 *      Reason: a module-scoped Symbol is a fresh symbol every time the module is evaluated,
 *      so an old ResponseError held by SWR is not recognised by a new module instance.
 *      Symbol.for uses the global registry and survives re-evaluation, so the marker
 *      keeps the property non-enumerable and the comment on the class stays true.
 *   2. Replace `function isResponseError(error: unknown): boolean {` with
 *      `export function isResponseError(error: unknown): boolean {`.
 *      Reason: the dashboard page needs the check to tell an unreadable body from a request
 *      that never reached the server, and the check has to stay shape-based, never instanceof,
 *      for the reason the file already documents.
 *
 * Edge cases
 *   - The check is read by shape, not by instanceof, because Vite gives the class
 *     a new identity under HMR while SWR still holds the old error.
 *
 * Acceptance
 *   - isResponseError is exported and returns true for ResponseError instances across module
 *     re-evaluations.
 *   - Existing statusOf, isNotFound and isTransient guards continue to pass all tests.
 *
 * Tests
 *   apps/web/src/lib/http.test.ts
 *
 * Delete this comment when the code is in place.
 */

/**
 * The status the API answers with for a fiscal year it holds no data for.
 *
 * The other two the API uses are a 400 for a malformed year, which the client
 * never sends because it checks the route first, and a 5xx for a failure on
 * the server, which isTransient covers.
 */
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

/**
 * The marker a ResponseError carries.
 *
 * A symbol, so it cannot collide with a field of the response body and does
 * not show up in the object's own keys.
 */
const unreadable = Symbol("unreadable");

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
  readonly [unreadable] = true;

  constructor(message: string) {
    super(message);
    this.name = "ResponseError";
  }
}

function isResponseError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  return (error as Record<symbol, unknown>)[unreadable] === true;
}

export function statusOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

export function isNotFound(error: unknown): error is HttpFailure & { status: 404 } {
  return statusOf(error) === NotFoundStatus;
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
