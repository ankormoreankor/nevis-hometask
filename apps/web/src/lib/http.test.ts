import { describe, expect, it, vi } from "vitest";
import {
  ApiError,
  isNotFound,
  isResponseError,
  isTransient,
  ResponseError,
  statusOf,
} from "./http";

describe("statusOf", () => {
  it("extracts status when numeric", () => {
    expect(statusOf({ status: 500 })).toBe(500);
    expect(statusOf(new ApiError(500, "error"))).toBe(500);
  });

  it("gives undefined for a string status", () => {
    expect(statusOf({ status: "500" })).toBeUndefined();
  });

  it("gives undefined for null and undefined", () => {
    expect(statusOf(null)).toBeUndefined();
    expect(statusOf(undefined)).toBeUndefined();
  });

  it("gives undefined for a plain Error", () => {
    expect(statusOf(new Error("boom"))).toBeUndefined();
  });
});

describe("isTransient", () => {
  it("is true for 500 and 503", () => {
    expect(isTransient({ status: 500 })).toBe(true);
    expect(isTransient({ status: 503 })).toBe(true);
  });

  it("is false for 400 and 404", () => {
    expect(isTransient({ status: 400 })).toBe(false);
    expect(isTransient({ status: 404 })).toBe(false);
  });

  it("is true for an error with no status", () => {
    expect(isTransient(new Error("network failure"))).toBe(true);
    expect(isTransient({})).toBe(true);
  });

  it("is false for a ResponseError", () => {
    expect(isTransient(new ResponseError("invalid json"))).toBe(false);
  });
});

describe("isNotFound", () => {
  it("is true for 404 and false for 500", () => {
    expect(isNotFound({ status: 404 })).toBe(true);
    expect(isNotFound({ status: 500 })).toBe(false);
    expect(isNotFound(new Error("not found"))).toBe(false);
  });
});

describe("isResponseError across module re-evaluation", () => {
  it("recognises a ResponseError created before vi.resetModules()", async () => {
    const errorBefore = new ResponseError("unreadable payload");
    expect(isResponseError(errorBefore)).toBe(true);

    vi.resetModules();
    const { isResponseError: isResponseErrorAfter } = await import("./http");
    expect(isResponseErrorAfter(errorBefore)).toBe(true);
  });
});
