/**
 * TASK: the dashboard contract
 *
 * Goal
 *   One Zod contract for the payload. The API validates what it sends, the
 *   client parses what it receives, and both break at compile time when the tree
 *   changes. There is no second interface describing the same data.
 *
 * Contract
 *   channelSchema, advisorSchema, branchSchema, companySchema
 *   Channel, Advisor, Branch, Company (z.infer of each)
 *     Channel  id, name, values
 *     Advisor  id, name, values, channels?
 *     Branch   id, name, values, employees?
 *     Company  id, name, values, branches
 *
 *   export type TreeNode = Company | Branch | Advisor | Channel
 *     The union exists so the chart and the tree helpers accept any node
 *     without a cast. It is a type, not a schema.
 *
 *   values   z.array(z.number()).length(12), the twelve months of a fiscal year
 *   id       z.uuid()
 *
 *   No month labels here. The wire carries twelve bare numbers, and which twelve
 *   depends on the fiscal year in the route, so the labels are a presentation
 *   concern and live in apps/web/src/lib/period.ts. The one fact this package
 *   keeps is the length: twelve.
 *
 * Steps
 *   1. The four source schemas, child first: channel, advisor, branch, company.
 *      Four named schemas. The tree has a fixed depth of four, so no z.lazy.
 *   2. z.uuid() is the Zod 4 form. z.string().uuid() still runs but is
 *      deprecated, and the installed version is 4.6.
 *   3. z.strictObject, not z.object: an unexpected key in the payload becomes a
 *      parse error instead of being stripped without a word.
 *   4. No response schemas. GET /api/dashboard/:year returns the company object
 *      itself, so the client parses the body with companySchema and the wire
 *      shape is the payload. A wrapper would be a second shape to keep in sync
 *      for no gain.
 *   5. Export the inferred types beside the schemas, plus TreeNode. Consumers
 *      import them with `import type`, because the base tsconfig sets
 *      verbatimModuleSyntax.
 *
 * Acceptance
 *   - npm run typecheck passes.
 *   - companySchema.parse(data) returns the tree. A values array of 11 numbers
 *     throws a ZodError whose path points at that array.
 *   - A branch without an employees key parses to an object with no employees
 *     key, and a channel with an extra key throws.
 *   - TreeNode accepts each of the four levels without a cast.
 *
 * Edge cases
 *   - employees and channels are optional, branches is not. The payload always
 *     carries three branches.
 *   - No .default([]) on the optional arrays. Absent means the level does not
 *     exist and the UI draws a leaf. [] would mean the level exists and is
 *     empty.
 *   - The payload is served as given, arithmetic quirks included. Nothing in
 *     this file corrects or derives a value.
 *
 * Tests
 *   none. The schema is exercised by the API at boot and by the client parse.
 *
 * Delete this comment when the code is in place.
 */
type NodeBase = {
  id: string;
  name: string;
  values: number[];
};

// Placeholders so the client compiles before the schemas land. Replace each
// alias with the z.infer of its schema; the shapes are meant to match.
export type Channel = NodeBase;
export type Advisor = NodeBase & { channels?: Channel[] };
export type Branch = NodeBase & { employees?: Advisor[] };
export type Company = NodeBase & { branches: Branch[] };
export type TreeNode = Company | Branch | Advisor | Channel;
