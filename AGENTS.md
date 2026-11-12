# Project rules

Nevis frontend take-home: dashboard over a company > branch > adviser > channel tree. Standalone repo, no shared config or history with the resume repository.

## Read first, in this order

1. `docs/brief.md` - the brief, the payload, and the five Figma links with node IDs.
2. `docs/context.md` - decisions already made, design facts, data inconsistencies, the idea backlog, constraints.
3. `docs/jd.md` - the role this is for.
4. `design/` - node trees (`nodes.json`, query with `jq`, never read whole) and 2x frame renders (`*.png`). Gitignored: employer material, never committed.

## Conventions

- Vite + React 19 + TypeScript strict. `createBrowserRouter`, CSS modules, tokens in one file.
- API: Express in the same repo, thin. Shared Zod schema in `shared/`, imported by server and client.
- Decisions land in the README's `## Decisions` section as they are made, not at the end. The brief grades them.
- Numbers rendered in the UI come from the payload unchanged. Where a level is missing (branches without employees, advisers without channels), the row is a leaf and says so.
- UI copy is plain and factual: no em dashes, no marketing adjectives, no exclamation.

## Who writes what

Configuration belongs to the agent. Implementation belongs to the user.

The agent writes without asking:

- config: `opencode.jsonc`, root and workspace `package.json`, `package-lock.json`, tsconfig files, Vite, ESLint, Vitest, Playwright, CI workflows, `render.yaml`, `.gitignore`, `.editorconfig`
- docs: `README.md`, `AGENTS.md`, `docs/context.md`, `docs/tasks/**`
- scaffolding: folders, empty files, `.gitkeep`, placeholder exports

The agent stops before implementation under `apps/**` and `packages/**`: components, routes, API handlers, schemas, styles, tests. It writes a task file instead.

A task file goes at `docs/tasks/<area>/<nn>-<name>.md`. Format and rules: `docs/tasks/README.md`. The agent may create the folders and stub files a task needs, but the body stays empty for the user.

Direct request overrides this. If the user says "build X", the agent builds X, and the permission prompt is the only confirmation. No task file.

`opencode.jsonc` enforces the split: edits under `apps/` and `packages/` ask, config paths and `docs/` are free, `design/` and the brief are read-only.

## Working notes

- Match the design's visual treatment, not its pixel positions: its chart bars disagree with its own table.
- Check arithmetic against the payload before calling a design value a bug. `docs/context.md` lists the three already found.
- Budget is 6-8 hours. Ship fewer things properly; state what was cut.
