import { type Company, companySchema } from "@nevis/shared";
import { payload2024 } from "@nevis/shared/payload";

/**
 * Fixtures for the unit tests.
 *
 * The tree is the payload the API serves, parsed against the same schema, so
 * a test cannot pass against a tree the server would never send.
 */
export const company2024: Company = companySchema.parse(payload2024);

/**
 * The item at an index, or a failure. The payload arrays are checked at
 * compile time, so this turns a missing fixture into a readable error rather
 * than an undefined further down the test.
 */
export function at<T>(items: readonly T[] | undefined, index: number): T {
  const item = items?.[index];
  if (item === undefined) {
    throw new Error(`No item at index ${index}`);
  }
  return item;
}
