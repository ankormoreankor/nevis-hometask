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

## data layer and routing

Decided
- `GET /api/dashboard` serves the company plus its branches; `GET /api/nodes/:id/children` serves one level. The node id is the path and the cache key, so expansion changes no query parameter.
- `hasChildren` is computed by the server from `employees` or `channels`. A stored flag would drift from the tree it describes.
- SWR is the client store: one key per request, in-memory only, no context. `revalidateIfStale: false` makes a collapsed row reopen from cache with no request; `shouldRetryOnError: false` lets the error demo settle.
- `/dashboard` is canonical, `/` redirects in a loader with `replace`, so Back leaves the app.
- The chart is fixed at company level. Expanding a row does not change it.
- URL expansion state is cut. Leaf requests stay open: the client never asks, because `hasChildren` is false.
- A failed row renders the message in its name cell, keeping one focus model instead of an error child row that needs a level and a position.

Done
- Task blocks rewritten in `packages/shared/src/index.ts`, `apps/api/src/data.ts`, `apps/api/src/index.ts`, `apps/web/src/lib/api.ts`, `TreeGrid.tsx`, `MonthlyChart.tsx`.
- `apps/web/src/router.tsx`, `routes/Dashboard.tsx`, a mount task in `main.tsx`. `swr@2.5.1` installed.

Verified
- `npm run typecheck` and `npm run build` at the root.

Open
- Nothing implemented under `apps/**` or `packages/**`. `App.tsx` stays until `main.tsx` mounts the router.

## selection drives the chart

Decided
- Supersedes the lazy-levels decision above. One request: `GET /api/dashboard` returns the payload object. A chart that remaps to a selected node needs that node client-side, so per-level fetching and selection pull against each other. The tree is twelve nodes.
- Selecting a row remaps the chart to its immediate children: branches, then advisers, then channels, and a single series for a leaf. Channels exist under one adviser, so a channel breakdown higher up is undefined, not merely expensive.
- Selection is `?node=<id>`, written with `replace`. A path segment would promise a page that renders from a cold load and oblige a not-found state; a query value can fall back to the company.
- Row click selects, chevron click expands, double-click does both. Enter and Space select, which is the APG default action; Right and Left expand and collapse.
- Cells stay unfocusable, rows only. APG calls that a tree view and advises against it when the columns scroll, so it is a stated deviation in the README.
- `aria-selected` on every row, and a live region announcing the chart's scope.
- The payload is served as given. The source query and filters are unknown, so correcting a cell would invent a rule for which one is wrong. Three mismatches stay in the README and nowhere else.

Done
- Task blocks rewritten in `packages/shared/src/index.ts`, `apps/api/src/data.ts`, `apps/api/src/index.ts`, `apps/web/src/lib/api.ts`, `TreeGrid.tsx`, `MonthlyChart.tsx`, `routes/Dashboard.tsx`.
- `apps/web/src/lib/tree.ts` added: `childrenOf`, `hasChildren`, `findNode`, `ancestorIds`.
- Dropped from the task blocks: the children endpoint, `NodeSummary`, both response schemas, `useChildren`, the skeleton row and the per-row error contract.
- README and `docs/context.md` rewritten, including two wrong sentences about the channel sums.

Verified
- `npm run typecheck` and `npm run build` at the root.

Open
- Nothing implemented under `apps/**` or `packages/**`. Five chart tokens still need values; the chart task states the requirement.
