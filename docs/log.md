# Project log

Append-only. One entry per `/log`. Read the last two entries at the start of a session.

`docs/context.md` holds what is true now. This file holds how it got there. When they disagree, `context.md` wins.

## brief and working context

Decided
- Vite, React 19, TypeScript strict, `createBrowserRouter`, CSS modules.
- Express in the same repo, deliberately thin. One Zod contract in `shared/`.
- Payload served unchanged. The arithmetic mismatches get documented, not fixed.

Done
- `docs/brief.md` captured verbatim; five Figma frames pulled into `design/`, gitignored.
- `docs/context.md` with decisions, design facts, idea backlog and constraints.

## repository setup

Decided
- npm workspaces over pnpm or Bun: one toolchain for three packages.
- One Render web service. Express serves `apps/web/dist` and `/api` from the same origin.
- CSS modules through Vite with `localsConvention: camelCaseOnly`; tokens in one file later.
- One `tsconfig.base.json` with `strict` and `noUncheckedIndexedAccess`.
- `opencode.jsonc` permissions are guardrails. The who-writes-what split is a rule the agent follows, checked against the diff.
- Task blocks live in the file being implemented. Frontend tasks state the contract, backend tasks spell out the Express and Zod steps.

Done
- Three workspaces, dependencies installed, minimal React page verified.
- `render.yaml`, CI workflow, README skeleton.

Verified
- `npm run build -w @nevis/web`, `npm run typecheck`.

Open
- Root `build` and `dev` red: `apps/api` had no tsconfig or entry point.

## first backend task

Decided
- API build is esbuild to one ESM file, `express` and `zod` external, `@nevis/shared` inlined. `tsc --noEmit` owns the types.
- Code names are plain: `GET /api/data`, `getData()`, `companySchema`. "Book" stays in prose only.

Done
- Task blocks in `packages/shared/src/index.ts`, `apps/api/src/data.ts`, `apps/api/src/index.ts`.
- `apps/api/tsconfig.json`, esbuild dependency, `.gitkeep` removed.

Verified
- `npm run typecheck` and `npm run build` at the root.

Open
- Nothing implemented yet. No client build served, no tests, no query parameters.

Next
- Implement the schema, then the data module, then the HTTP surface.

## project log

Decided
- `docs/log.md` is the session log: append-only, one entry per `/log`, last two entries read at start.
- Application logging with pino is deferred until the table and chart exist. The brief does not grade it.

Done
- This file, plus the read and write rules in `AGENTS.md`.

Open
- Whether pino goes in at all.

## log trigger and visibility

Decided
- `docs/log.md` is gitignored: local history, not shipped to the reviewer.
- The trigger is explicit, `/log` or the user saying "log it". An agent has no signal for the end of a session, so guessing would produce entries nobody asked for.
- `/log` is a project command in `.opencode/commands/log.md`.

Done
- `.gitignore` entry, the command file, the `## Project log` rule rewritten around the trigger.

Open
- Whether the agent should also write on confirmed decisions mid-session. Left out for now: it makes entries noisy.

## log stays in git

Decided
- Supersedes the gitignore decision above: `docs/log.md` is committed with the repo. The work behind the decisions is worth showing, and the file is the record of how the repo was built.
- Entries carry no dates. The agent does not need them, and they turn a decision log into a timesheet.

## treegrid and chart contracts

Decided
- `TreeGrid` is a native `<table role="treegrid">` with the APG rows-first keyboard model. Accordion or Collapsible over divs rebuilds table semantics by hand, and TanStack Table solves only the flattening.
- `MonthlyChart` is shadcn Chart over Recharts 3, `accessibilityLayer` passed explicitly. It stacks the three branches: the design's channel legend is illustrative, branch values close against the company row.
- Tailwind v4 and shadcn for the two data components, CSS modules for the page shell. `cn` replaces clsx plus tailwind-merge.
- `MONTHS` joins the shared contract, because both components label the same axis.
- Inter Variable, self-hosted. Geist is shadcn's preset default and the design is Inter.
- Expansion stays internal state. URL state is out of scope.

Done
- shadcn init with table and chart only; button, card, base-ui, cva and lucide removed as unused.
- Task blocks and placeholders in `apps/web/src/components/TreeGrid.tsx` and `MonthlyChart.tsx`, README decisions, `docs/context.md`.

Verified
- `npm run typecheck` and `npm run build` at the root; `npm run build -w @nevis/web` emits Inter subsets.

Open
- `--chart-1/2/3` still hold shadcn defaults; the design palette is specified in the chart task.

Next
- Implement the shared schema, then the data module and the HTTP surface, then the two components.
