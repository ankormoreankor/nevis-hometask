import * as z from "zod";

const nodeBaseSchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  values: z.array(z.number()).length(12),
});

export const channelSchema = nodeBaseSchema;
export const advisorSchema = nodeBaseSchema.extend({
  channels: z.array(channelSchema).optional(),
});
export const branchSchema = nodeBaseSchema.extend({
  employees: z.array(advisorSchema).optional(),
});
export const companySchema = nodeBaseSchema.extend({
  branches: z.array(branchSchema).optional(),
});

type NodeBase = z.infer<typeof nodeBaseSchema>;

export type Channel = NodeBase;
export type Advisor = z.infer<typeof advisorSchema>;
export type Branch = z.infer<typeof branchSchema>;
export type Company = z.infer<typeof companySchema>;
export type TreeNode = Company | Branch | Advisor | Channel;

export function formatIssues(error: z.ZodError): string {
  return z.prettifyError(error);
}

/**
 * Whether a segment names a fiscal year.
 *
 * Four digits with no leading zero: "2024" is a year, "0024" and "abc" are
 * not. The client checks the route and the API checks the parameter with the
 * same rule, so neither sends nor accepts a value the other would reject.
 */
const FISCAL_YEAR = /^[1-9]\d{3}$/;

export function isFiscalYear(year: string): boolean {
  return FISCAL_YEAR.test(year);
}
