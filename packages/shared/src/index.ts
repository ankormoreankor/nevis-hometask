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
