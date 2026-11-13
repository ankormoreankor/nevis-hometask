/**
 * TASK: the dashboard contract
 *
 * Goal
 *   One Zod schema for the payload, imported by the API to validate what it
 *   sends and by the client to type what it receives. Both sides break at
 *   compile time when the tree changes.
 *
 * Contract
 *   Exports
 *     companySchema, branchSchema, advisorSchema, channelSchema
 *     Company, Branch, Advisor, Channel (z.infer of each)
 *
 *   Shape, from docs/brief.md
 *     Channel  id, name, values
 *     Advisor  id, name, values, channels?
 *     Branch   id, name, values, employees?
 *     Company  id, name, values, branches
 *
 *   values   z.array(z.number()).length(12), Feb 2024 to Jan 2025
 *   id       z.uuid()
 *
 * Steps
 *   1. channelSchema, then advisorSchema, then branchSchema, then companySchema.
 *      Four named schemas. The tree has a fixed depth of four, so no z.lazy.
 *   2. z.uuid() is the Zod 4 form. z.string().uuid() still runs but is
 *      deprecated, and the installed version is 4.6.
 *   3. z.strictObject, not z.object: an unexpected key in the payload becomes a
 *      parse error instead of being stripped without a word.
 *   4. Export the inferred types beside the schemas. Consumers import them with
 *      `import type`, because the base tsconfig sets verbatimModuleSyntax.
 *
 * Acceptance
 *   - npm run typecheck passes.
 *   - companySchema.parse(data) returns the tree. A values array of 11 numbers
 *     throws a ZodError whose path points at that array.
 *   - A branch without an employees key parses to an object with no employees
 *     key.
 *
 * Edge cases
 *   - employees and channels are optional, branches is not. The payload always
 *     carries three branches.
 *   - No .default([]) on the optional arrays. Absent means the level does not
 *     exist and the UI draws a leaf. [] would mean the level exists and is
 *     empty.
 *
 * Tests
 *   none. The schema is exercised by the API at boot and, later, by the client
 *   parse.
 *
 * Delete this comment when the code is in place.
 */
export {};
