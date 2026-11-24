# Task template

The agent writes the task into the file the user is going to implement, as a comment at the top of that file. There is no separate task file.

## Calibration

The user is a senior frontend developer and a junior backend developer. Write to that.

### Frontend

`apps/web`. React 19, hooks, CSS modules, TypeScript, browser APIs and accessibility are known, so the task does not explain them. Spend the words on the contract: props, state shape, data source, exact field names, design node reference, token names, keyboard and ARIA behavior the brief grades. No steps. A senior turns a contract into code.

### Backend

`apps/api` and `packages/shared`. Express, Node and Zod are new. Name the middleware and its order, where validation runs, the status code and body for each outcome, the env vars, and what Express does in production when it serves the built client. Explain the non-obvious line: that Express 5 forwards a rejected promise to the error handler is worth a sentence, `res.json()` is not. Include steps, one route or one middleware per step.

Both get exact paths, exact names, observable acceptance, and no implementation code.

## Shape

TypeScript and TSX:

```ts
/**
 * TASK: <one line, what this file should do>
 *
 * Goal
 *   <why this file exists, one or two sentences>
 *
 * Contract
 *   <types, props, exports, endpoints, field names that other code relies on>
 *
 * Steps
 *   <backend only, ordered>
 *
 * Acceptance
 *   - <observable check>
 *
 * Edge cases
 *   - <the case that is easy to miss>
 *
 * Tests
 *   <what to cover, or "none">
 *
 * Delete this comment when the code is in place.
 */
```

CSS modules use the same block with `/* ... */`. Markdown files use the same headings without the comment wrapper.

## Rules

- One task per file. A unit of work that spans files gets a block in each of them.
- The contract is complete enough to write the file without reading the rest of the repo.
- Below the block, leave the smallest placeholder that keeps `npm run build` and `npm run typecheck` green: `export {}` for a module, a component returning `null`, an empty rule for a stylesheet. The placeholder is scaffolding, not a draft.
- Acceptance items are observable. No "looks right".
- No implementation code in the block. Signatures and shapes only.
