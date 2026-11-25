import { type Company, companySchema } from "@nevis/shared";
import { payload2024 } from "@nevis/shared/payload";

// The tree is the payload the API serves, parsed against the same schema.
export const company2024: Company = companySchema.parse(payload2024);

export function at<T>(items: readonly T[] | undefined, index: number): T {
  const item = items?.[index];
  if (item === undefined) {
    throw new Error(`No item at index ${index}`);
  }
  return item;
}
