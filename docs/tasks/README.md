# Tasks

One file per unit of implementation. The agent writes it, the user writes the code, the agent reviews the result.

Path: `docs/tasks/<area>/<nn>-<name>.md`. Areas: `shared`, `api`, `web`, `tests`.

A task is done when its acceptance list passes and `npm run typecheck && npm run test` is green. Then delete the file. If the work settled a question the brief grades, the decision moves to the README's `## Decisions` section instead.

## Template

```md
# <Title>

## Goal
One sentence. What exists after this and why.

## Files
- `path/to/file.ts` - create or edit, and what goes in it.

## Contract
The types, props, endpoints, schema fields or behavior that other code relies on. Exact names and shapes.

## Steps
1. Ordered, small, checkable.

## Acceptance
- [ ] Something observable.

## Edge cases
- The cases that are easy to miss.

## Tests
What to cover and where.

## Notes
Anything from `docs/context.md` or `docs/brief.md` that applies. Numbers, copy, design references.
```

## Rules

- The task names exact paths. The user should not have to guess where a file goes.
- The contract is complete enough to write the file without reading the rest of the repo.
- Acceptance items are observable, not "looks right".
- No implementation code in the task. Signatures and shapes only.
- One task per commit-sized unit. If it needs more than a screen of steps, split it.
