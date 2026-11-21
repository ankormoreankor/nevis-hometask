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

## year routing

Decided
- The fiscal year is a path segment: `/dashboard/2024`, `GET /api/dashboard/:year`. It selects a different payload and can be absent, so it is a resource, not a view. The node stays `?node=`.
- A malformed year and a year with no data are both 404. There is no path that means "a dashboard without a year", so no 400 exists. `/dashboard` and `/` redirect to `/dashboard/2024`; a valid four-digit year always renders; `/dashboard/abc` is not found.
- `2024` means FY2024, Feb 2024 to Jan 2025. The audience knows fiscal years, so the page says 2024 and the period line spells out the months.
- `dataByYear` is a `Map` with one entry, parsed once at boot into `Map<number, Company>`. The map is the seam a real source replaces; one entry is the honest mock.
- `MONTHS` leaves `shared/`. The wire carries twelve bare numbers; `apps/web/src/lib/period.ts` owns the fiscal table, `formatMonthLabel`, `formatPeriod` and `currentFiscalYear`.
- The empty year is a state, not an error. NoData renders a heading with the year, a select over 2000 to the current fiscal year plus Go, and a link to `/`. The select always shows a disabled placeholder and resets on every submit; a same-year pick skips navigation. A year change uses `push`.

Done
- Task blocks rewritten in `packages/shared/src/index.ts`, `apps/api/src/data.ts`, `apps/api/src/index.ts`, `apps/web/src/lib/api.ts`, `TreeGrid.tsx`, `MonthlyChart.tsx`, `routes/Dashboard.tsx`, `router.tsx`.
- `apps/web/src/lib/period.ts`, `apps/web/src/routes/NoData.tsx`, `apps/web/src/routes/NotFound.tsx` added as task blocks with compiling placeholders.
- README and `docs/context.md` updated; `MONTHS` references removed.

Verified
- `npm run typecheck` and `npm run build` at the root.

Open
- Nothing implemented under `apps/**` or `packages/**`. Five chart tokens still need values. No tests yet.

## superseding the year status codes

Decided
- The "year routing" entry above said a malformed year and a year with no data are both 404, and that no 400 exists. That is reversed.
- A malformed year is 400 `{"error":"Invalid year format"}` and a year with no data is 404 `{"error":"Data not found for the given year"}`. A bad parameter and a missing resource are different things, and 400 says so.
- The client never sees the 400. The route and the page both reject a year that is not four digits before anything is fetched, so the branch is there for any other caller, and `scripts/api-smoke.sh` exercises it directly.

Done
- `apps/api/src/index.ts` answers 400 for a malformed year and 404 for a year with no data.
- README and `docs/context.md` carry the two status codes.

## superseding the deploy decision

Decided
- The "repository setup" entry above picked one Render web service, with Express serving `apps/web/dist` and `/api` from the same origin. That is reversed.
- No deploy. The project runs locally with `npm run dev`, and the brief asks for a repository and a README, not a URL. A public copy would need one service for both, a domain and a pipeline, and it would show none of the work being graded.
- In development Vite proxies `/api` to the API port.

Done
- `render.yaml` and the deploy workflow are gone.
- README says nothing is deployed.

## review fixes

Decided
- The chart mapping moves out of the component into `apps/web/src/lib/chart.ts`: `toSeries`, `toRows`, `toDomain` and `scopeTitle`. The brief grades how the data maps into the chart, and a pure module makes that a vitest file instead of a browser test.
- The visible row list moves into `apps/web/src/lib/tree.ts` as `flattenVisible`. The treegrid renders rows instead of walking the tree, and the level, the sibling counts and the kind of each row come back with them.
- The route table is four sibling routes. A loader on a parent route runs on every navigation to its children, so nesting `dashboard` under `/` made the `/` loader redirect to the URL it was already on.

Done
- Task blocks rewritten in `router.tsx`, `routes/Dashboard.tsx`, `TreeGrid.tsx`, `MonthlyChart.tsx`, `lib/tree.ts`. `apps/web/src/lib/chart.ts` added.
- The contrast figures in README and `docs/context.md` are recomputed, and the design drift note names Sep, Oct, Nov and Dec.
- The task block in `apps/api/src/data.ts` is gone, the file holds only code.

Verified
- `npm run typecheck`, `npm run build` and `npm run lint` at the root, and `npm run api:check` against a running API: 32 checks pass.

Open
- Nothing implemented under `apps/**` or `packages/**`. Five chart tokens still need values.

## the router, the toolchain and the skeleton

Decided
- The router is done. Four sibling routes, two redirects with `replace`, the dashboard route and the not-found route. The parent-loader nesting that made "/" redirect to the URL it was already on is gone.
- The placeholder shell goes with it: `App.tsx`, `App.module.css` and `lib/utils.ts` are deleted, and the sidebar tokens that came with the shadcn init are out of `index.css`.
- The cn helper is imported from the "cn" package everywhere, so no file reads a local utils module. `components.json` keeps its utils alias, because that is where the shadcn CLI would write the helper if a component is added later.
- The loading state uses the shadcn Skeleton, so the pulse comes from the tokens.
- fallow stays. It reports the scaffolding as dead code until the components land, and it becomes a real check after that.

Done
- `main.tsx` mounts the router and `router.tsx` holds the flat route table, both without a task block.
- `vite.config.ts` uses `import.meta.dirname`, so the build stops warning about the native config loader.
- vitest, Playwright and Biome are installed for the web workspace, with the `test`, `test:e2e` and `lint` scripts, and CI runs the browser suite once it has specs.
- `apps/web/src/components/ui/skeleton.tsx` added.

Verified
- In a browser: "/" lands on /dashboard/2024 in one hop, Back lands on the dashboard and not on the pre-redirect URL, a valid year never redirects, and the console stays clean.
- `npm run typecheck`, `npm run build` and `npm run lint` at the root, and `npm run api:check` against a running API: 32 checks pass.

Open
- `DEFAULT_FISCAL_YEAR` still moves out of the router's two literals and into `lib/period.ts`.
- The dashboard components are still task blocks. Five chart tokens need values.

## one Biome config at the root

Decided
- Biome formats as well as lints. Prettier was the alternative and loses: one tool, one config the editor and CI read, and Biome parses TypeScript without the compiler.
- One `biome.json` at the repo root, style pinned to the shape the code was already written in: two spaces, 100 columns, double quotes, semicolons. The nested `apps/web/biome.json` is gone. The editor's language server looks for a config at the workspace root and walks up, so the nested one was invisible to it, and Biome rejects a root config beside a nested one.
- Import sorting is the `organizeImports` assist, applied on save through `editor.codeActionsOnSave`. Safe lint fixes stay off on save.

Done
- Root `biome.json` and root `.vscode/settings.json`: format on save for TypeScript, import sorting on save.
- `@biomejs/biome` moved to the root package with `lint`, `format` and `check` scripts. CI runs `npm run check`.
- README, `docs/context.md` and `AGENTS.md` carry the style and the scripts.

Verified
- `biome rage` on the daemon the editor talks to: config loaded from `biome.json`, formatter enabled. The extension's LSP log shows the nested-config error before the change and a clean start after it.
- `npm run lint` passes at the root over 19 files.

Open
- `npx biome check --write .` has not been run. Five files are unformatted, three have unsorted imports, and `apps/api/src/data.ts` still carries the tab reformat the broken config produced.
