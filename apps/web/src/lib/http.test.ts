/**
 * TASK: Unit tests for http status extraction and retry predicates
 *
 * Goal
 *   Verify statusOf, isTransient, isNotFound, and ResponseError retry behavior.
 *
 * Contract
 *   Cover the following cases:
 *   - statusOf:
 *     - An error carrying status: 500 gives 500.
 *     - An error carrying a string status gives undefined.
 *     - null and undefined give undefined.
 *     - A plain Error gives undefined.
 *   - isTransient:
 *     - 500 gives true.
 *     - 503 gives true.
 *     - 400 gives false.
 *     - 404 gives false.
 *     - An error with no status gives true.
 *     - A ResponseError gives false.
 *   - isNotFound:
 *     - 404 gives true.
 *     - 500 gives false.
 *   - ResponseError behavior:
 *     - A ResponseError thrown by the fetcher path is never transient,
 *       so a malformed payload costs one request and not three.
 *
 * Acceptance
 *   - All specified statusOf cases pass.
 *   - All specified isTransient cases pass.
 *   - All specified isNotFound cases pass.
 *   - ResponseError non-transience check passes.
 *
 * Tests
 *   Self-contained in this file.
 *
 * Delete this comment when the code is in place.
 */

import { describe, expect, it } from "vitest";

describe("http", () => {
  it("is planned", () => {
    expect(true).toBe(true);
  });
});
