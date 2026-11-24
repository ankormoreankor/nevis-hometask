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

## status guards and a parsing client data layer

Decided
- The page branches on the status, not on the transport. `apps/web/src/lib/http.ts` holds `HttpStatuses`, `ApiError` and the guards `isBadRequest`, `isNotFound` and `isServerError`, and the Dashboard never names the fetcher.
- The guard reads the shape of the error rather than `instanceof ApiError`. Vite gives the class a new identity under HMR while SWR still holds the old error, so the 404 branch would stop working until a reload.
- `mutate` is exposed as a zero-arg wrapper. SWR's bound mutate forwards any argument it receives, so `onClick={mutate}` would hand React's click event to SWR and it would land in the cache as data.
- The revalidation switches stay at SWR's defaults, which are already `true`, because the payload can change server-side. `shouldRetryOnError: false` is the only option the hook passes.
- Zod stays in `packages/shared`, which already owns the schema. `formatIssues` wraps `z.prettifyError` so the web app never imports zod itself.

Done
- `apps/web/src/lib/http.ts` added, and `packages/shared` exports `formatIssues`.
- The fetcher parses the JSON, then the schema, and throws `ApiError` with the status and the body text on a non-2xx.
- `useDashboard` returns `company`, `error`, `isLoading`, `isValidating` and `mutate`.
- README and `docs/context.md` carry the revalidation decision.
- `biome check --write .` run over the workspace, so `npm run check` is clean and the payload in `apps/api/src/data.ts` is the same data, reformatted.

Verified
- In a browser: `/dashboard/2024` renders the company with one GET, `/dashboard/2025` renders the empty year, `?simulate=error` surfaces the status, and no rejection goes unhandled.
- A malformed payload gives `✖ Invalid UUID → at id` and the rest of the issues, from `z.prettifyError`.
- `mutate` triggers exactly one refetch and leaves `company` as the object, not the click event.

Open
- `http.ts` exports neither `statusOf` nor `HttpFailure`, so the page cannot print the status in its error message.
- `Dashboard.tsx` still carries its `console.log` and `console.dir`.

## the simulate feature and the retry rule

Decided
- `?simulate=slow|error` is gone from the API and from the client. Fault injection does not belong in the product path, and the slow case is one click away in the DevTools throttling dropdown.
- `shouldRetryOnError` is a function, not a flag. A 5xx and a request that never got an answer get another try; a 4xx never does, because a response the server meant is final and a 404 for a fiscal year with no data would otherwise be fetched again for as long as the page was open.
- `errorRetryCount: 2` bounds the retries. `errorRetryInterval` stays at SWR's default, so the backoff grows.
- A body the client cannot read is final too. The server did answer, and a body that is not JSON or does not match the contract comes back the same way.
- The status is read off the error by shape, never by `instanceof ApiError`, for the reason the guards already have.
- The loading and error states are covered by the browser suite, which intercepts the route.

Done
- The middleware, the `Simulate` type and the query-string append are gone. The SWR key is the plain dashboard path again.
- `apps/web/src/lib/http.ts` holds `statusOf`, `isTransient` and `ResponseError`. The marker on `ResponseError` is read by shape, so it survives HMR like the guards do.
- The fetcher throws `ResponseError` for a body that is not JSON and for a body that does not match the contract, so a malformed payload costs one request instead of three.
- The smoke script dropped the simulate checks, the health-delay check and the `elapsed` helper with them: 27 checks, 0 failed.
- `apps/web/e2e/states.spec.ts` and `apps/web/e2e/treegrid.spec.ts` hold the contracts for the states and the keyboard model, one passing test each and a `test.fixme` per spec still to be written.
- README and `docs/context.md` carry the retry rule and the states.

Verified
- `npm run check`, `npm run typecheck` and `npm run build` are clean.
- `npm run api:check`: 27 checks pass. `npm run test:e2e`: 2 pass, 9 fixme.

Open
- The browser specs are placeholders, so the states and the keyboard model are not covered yet.
- The page is the only thing that can announce the two states, and it is written by hand.

Next
- Write the browser specs, starting with the error state and the loading state.

## the chart on the dashboard page

Decided
- The mock payload moves to `@nevis/shared/payload`, its own entry point, so the API serves it and the web tests read the same tree instead of keeping a second copy of the numbers.
- The chart axis comes from the stack, not from the row of the node: the company stacks to 350 and rounds to 400, Branch 1 to 216 and 300, Anna Blackwood to 38 and 40.
- The chevron is pointer only and leaves the focus on the row, so Enter on a row selects and never toggles.
- The client checks the year for four digits and asks for it as written, so it and the server ask for the same one.

Done
- `lib/period.ts`, `lib/tree.ts` and `lib/chart.ts`: the fiscal calendar, the tree helpers and the chart mapping.
- `MonthlyChart`, `TreeGrid` and the dashboard page, with the loading, error, empty-year and invalid-year states.
- The design palette in the chart tokens, the adviser circle in `index.css`, 32 unit tests and 14 browser specs.

Verified
- `check`, `test`, `typecheck`, `build`, `test:e2e` and `api:check` pass.
- In a browser: the chart remaps on selection, the deep link opens the path, the keyboard model works, 375px does not overflow.

Open
- The chart has no data table of its own, and the ARIA tree is read through attributes rather than the accessibility API.
- The bundle is one chunk and Recharts is most of it.

Next
- Walk the ARIA tree in the browser suite and split the bundle.

## the state of the project

Done
- The README's two mock-data notes are merged into one, and the Playwright config names the states the suite covers.

Verified
- `check`, `typecheck`, `test` (33 cases), `build`, `test:e2e` (14 specs) and `api:check` (27 checks) all pass.

Open
- Two task blocks landed in the tree unimplemented: the unreadable-body branch on the page, and the exported `isResponseError` with a globally registered symbol.
- The chart has no data table of its own, so its numbers reach a screen reader only through the treegrid.
- The browser suite reads ARIA attributes, not the computed accessibility tree.
- The README never answers the one question in `docs/context.md`: whether the figures are counts, money or something else.
- The bundle is one chunk, 814 kB, and Recharts is most of it.
- The README's data-quality note has no UI decision behind it.
- Reduced motion is implemented but unasserted, and a stale response is uncovered.
- Small ones: `useDashboard` returns two fields the page never reads, `TreeGrid.tsx` has a duplicated comment, `npm run analyze` fails on 3 unused shadcn exports and on coupling noise.

Next
- Implement the two pending task blocks, then the chart's data table, the accessibility tree check and the README's open question.

## the year rule and the chart announcement

Decided
- A year is four digits with no leading zero, 1000 to 9999. "0024" is a typo, not a year, so the route is not found and no request is made.
- The rule lives in `@nevis/shared` as `isFiscalYear` and the API reads it too, so the client and the server cannot disagree about what a year is.
- The picker starts at 2000 because that is what it offers, not because the route stops there. The constant is `FISCAL_YEAR_PICKER_MIN`.
- The chart announces the month it is on from a polite live region inside the figure, fed by the tooltip content.

Done
- The two task blocks from the previous entry are implemented and their comments are gone: the unreadable-body branch on the page, and `isResponseError` with a globally registered symbol, covered by `http.test.ts`.
- The chart's live region reads "Mar 2024. Branch 1 157. Branch 2 80. Branch 3 30." on every arrow stop.
- The Retry button of the stale-data notice sits outside the live region.
- The README and the e2e README say which two specs were run against the old behaviour, instead of claiming all of them were.

Verified
- `check`, `typecheck`, `test` (42 cases), `build`, `test:e2e` (15 specs) and `api:check` (29 checks) pass.
- In a browser: `/dashboard/0024` and `/dashboard/abc` are not found with no request, `/dashboard/1999` is empty, the live region reads the month, and there are no console errors.

Open
- The chart still has no data table of its own, and the ARIA tree is read through attributes rather than the accessibility API.
- The bundle is one chunk and Recharts is most of it.

Next
- Walk the ARIA tree in the browser suite and split the bundle.

## narrow the fiscal year rule

Decided
- A year is four digits starting with 1 or 2, so 1000 to 2999. This supersedes the "four digits with no leading zero" of the previous entry: a year in the next millennium is a typo as much as "0024" is.
- The client and the API still read one predicate, so the rule is one character class in the shared package and everything else follows from it.

Done
- `isFiscalYear` takes 1000 to 2999. The unit cases, the API smoke checks, the browser suite and the docs follow.
- A browser spec covers `/dashboard/3000`: not found, and no request.

Verified
- `check`, `typecheck`, `test` (42 cases), `build`, `test:e2e` (16 specs) and `api:check` (30 checks) pass.
- The API answers 400 for 3000 and 0024, 404 for 1999 and 2999, 200 for 2024. In the browser `/dashboard/3000` and `/dashboard/0024` are not found and make no request, and `/dashboard/1999` is empty.

Open
- The chart still has no data table of its own, and the ARIA tree is read through attributes rather than the accessibility API.
- The bundle is one chunk and Recharts is most of it.

Next
- Walk the ARIA tree in the browser suite and split the bundle.

## the chart owns its focus model

Decided
- Recharts 3.8 keeps its keyboard index on blur, so a second Tab into the chart opened no tooltip and continued from the old month, and v3 has no controlled active index. `MonthlyChart` owns the focus model instead.
- The chart container is the one focus stop: `role="application"`, named by the figure's title. No ring around the chart; the highlighted month and its tooltip are the focus indicator.
- The visible month is a mouse move at the tick position, so the library keeps the cursor, the tooltip, the flipping and the animation. `throttleDelay={0}` so a queued frame cannot reopen the tooltip after a blur.

Done
- Focus, blur and key handling on the container, an `XAxisTicksBridge` for the tick coordinates, and the announcement cleared when the tooltip goes inactive.
- Bars are keyed by scope and year, so a scope change animates the columns from the baseline instead of sliding them sideways.
- The browser specs focus the application element, and one new spec covers the reset on blur. README and `docs/context.md` carry the decision.

Verified
- `check`, `typecheck`, `test` (42 cases), `build` and `test:e2e` (17 specs) pass.
- In a browser: Tab into the chart shows Feb 2024 with the tooltip and the cursor band, ArrowRight shows Mar 2024, Tab away hides both, Shift+Tab back shows Feb 2024 again.

Open
- The chart still has no data table of its own, and the ARIA tree is read through attributes rather than the accessibility API.
- The bundle is one chunk and Recharts is most of it.

Next
- Walk the ARIA tree in the browser suite and split the bundle.

## the selection follows a closed row

Decided
- Closing a row lifts a selection that sits inside it to that row. The header and the chart follow, because they read the selection. A row that is hidden cannot be the scope.
- The lift lives in the grid, not on the page. Expansion is local state, so the grid is the only place that knows a row was closed.
- The open state is read from the render state, never from inside the setExpanded updater: StrictMode runs updaters twice, and a selection write is not something to run twice.
- The row stays closed after the lift. The deep link effect expands the ancestors of the selection and never the selection itself, so it cannot reopen the row.
- ArrowLeft on a leaf still only moves the focus. Collapsing a parent keeps its second press.

Done
- `toggle` in `apps/web/src/components/TreeGrid.tsx` reads `expanded.has(id)` and calls `onSelect(id)` when the selection is inside the row.
- Three browser specs: the chevron, ArrowLeft, and the company row, which clears `?node=`.
- README selection bullet and the spec counts. The README count was one behind before this; `docs/context.md` says 20 specs.

Verified
- `check`, `typecheck`, `test` (42 cases) and `test:e2e` (20 specs) pass.
- In a browser: collapsing Anna with the chevron leaves Anna selected and closed, the URL on Anna, the heading on Anna Blackwood and the chart on "Anna Blackwood, by channel".

Open
- The chart still has no data table of its own, and the ARIA tree is read through attributes rather than the accessibility API.
- The bundle is one chunk and Recharts is most of it.

Next
- Walk the ARIA tree in the browser suite and split the bundle.

## the state pages get their own page

Decided
- The two state pages share a shell: a centred column with a decorative video above the content, 28px between them.
- Video, not GIF. A GIF is 256 colours and dithered, so a re-encode of one looks worse, and H.264 is smaller at the same quality. The files live in the repo, not hotlinked.
- The video is decorative and pausable. A loop past five seconds needs a control under WCAG 2.2.2, and prefers-reduced-motion shows the poster frame instead of playing.
- The empty year keeps its label for screen readers only, and the select gets a fixed width, so a font swap cannot move the row.
- The dashboard skeleton waits 200ms. The client cannot know a year is empty before the response, and a 404 should not flash a chart skeleton.
- The font is vendored as the Latin subset and preloaded. Google Fonts is the same swap with a third-party request on top.
- The year picker opts into `appearance: base-select` inside `@supports`, so the browser anchors the list under the control. Firefox keeps the native popup.

Done
- `StatePage.tsx` with its module CSS, `useReducedMotion`, `useDelayedFlag`, the two videos and their posters.
- NoData and NotFound rewritten around the shell. The select lost its visible label, gained a chevron with room and a fixed width, and the Go button lost its hover while disabled.
- `index.css` carries the font face and the picker rules, `index.html` the preload, `public/fonts` the file and its licence. The fontsource dependency is gone.
- Accessibility is a standing rule in `AGENTS.md` now. README and `docs/context.md` follow. 44 unit cases, 36 browser specs.

Verified
- `check`, `typecheck`, `test` (44 cases) and `test:e2e` (36 specs) pass.
- In a browser: the list opens under the control, the value sits centred in the closed select, and the first paint does not move when the font lands.

Open
- Firefox keeps the native picker, so the closed control there is the old one.
- The two clips are from a TV show, and the licence for a public repository is not settled.

Next
- Walk the ARIA tree in the browser suite and split the bundle.

## the column top is rounded where the top segment is

Decided
- The radius belongs to the rectangle, not to a clip path. Recharts calls the bar shape on every animation frame, so the corners stay rounded while the column grows.
- The segment that tops a month comes from the values, through `toTopSeries` in `lib/chart.ts`. Recharts draws nothing for a zero, so the last series is not always the visible top.
- `BarStack` was tried and dropped: its clip path is built from the settled layout, so the rounding appeared only in the last frames of the grow.
- The radius sits on the rectangle path, so the segment boundaries inside a column stay square.

Done
- `toTopSeries` gives the key of the last series above zero for each of the twelve months, and `null` for a month with nothing to draw.
- `MonthlyChart` draws each bar with a `shape` that renders Recharts `Rectangle` with `radius={[4, 4, 0, 0]}` on the topmost segment of that month.
- Four unit cases for `toTopSeries`, and one browser spec that groups the rendered rectangles per column and checks that the topmost one carries the arc.
- README and `docs/context.md` carry the decision. 48 unit cases, 37 browser specs.

Verified
- `check`, `typecheck`, `test` (48 cases), `build` and `test:e2e` (37 specs) pass.
- In a browser: Feb, Mar and Aug under Anna Blackwood are rounded on the segment that tops the column, the company and Branch 1 keep square boundaries between segments, a leaf scope is rounded, and the corners stay rounded for the whole grow.

Open
- The chart still has no data table of its own, and the ARIA tree is read through attributes rather than the accessibility API.

Next
- Walk the ARIA tree in the browser suite and split the bundle.

## the surfaces and the row states follow the design

Decided
- The page is #F9F9F9 and both blocks are white cards with an 8px radius, no border and no shadow, so they can be reused over any surface. The design's cream #F7F5ED artboard was rejected.
- The month headers are 14px/400 in the muted ink #727271, which is the design's ink at 60%, on a 56px header row that is not clickable and therefore has no hover.
- The selected row is a 3px ink rail at its left edge, with no fill and no weight change on the name. The design has no selected state, so the treatment is ours.
- Every row gets the muted hover band (#F7F7F7), the selected row included, because a table hover is a scanning cue and not only a clickable cue.
- The focus ring is the neutral gray oklch(0.556 0 0), #737373 at 4.74:1 on white, inset 2px so the table's overflow container cannot clip the horizontal sides.
- The table card pads 8px inside its radius, so the corner cannot cut the rail or the ring.
- A bar click focuses one of Recharts' internal layers, so the chart drops the focus outline inside the plot and on the container. The keyboard path still shows the tooltip and the live region.

Done
- `index.css` carries the page token; the chart legend and the axis ticks follow the muted ink.
- `TreeGrid` has the 56px header row, the muted month headers, the last column inset, the chevron ink and its overlay, the rail, the hover band and the inset ring.
- `Dashboard` wraps the chart in a 24/16/16 white card and the table in a white card with 8px of padding. The trail stays above the chart card.
- README and `docs/context.md` carry the decisions.

Verified
- `check`, `typecheck`, `test` (48 cases) and `test:e2e` (37 specs) pass.
- In a browser: the month headers read as the design, the rail marks the selected row, the ring is complete on all four sides, the hover band follows the pointer across a row, and a bar click draws no ring.

Open
- A click on the chevron still leaves the row focus-visible, so the ring can show after a pointer click on the grid. Only the chart's ring was fixed.
- The chart still has no data table of its own, and the ARIA tree is read through attributes rather than the accessibility API.

Next
- Walk the ARIA tree in the browser suite and split the bundle.

## the dashboard fits a narrow screen

Decided
- Below 640px the chart turns on its side, months down the y axis and values along x. Twelve columns do not fit a phone, and 272px of plot cannot hold twelve 24px targets.
- The legend leaves the Recharts plot and becomes a list under it. The library's legend is a flex row with no wrapping, so a branch with five advisers broke the names mid-word.
- The treegrid keeps a sticky name column capped at clamp(160px, 48vw, 296px), so the month area does not change with the depth of the tree. A name that does not fit truncates, and the full name stays in the accessible name and in the title.
- The month headers read "Feb" below 640px and "Feb 2024" from 640px up, because the header text set the column width and not the numbers.
- The dev server binds to the network, so the dashboard can be opened on a phone on the same Wi-Fi.

Done
- `useMediaQuery` and `formatMonthShort`, the vertical layout below 640px with the arrow keys up and down, the legend list, the capped sticky column with the truncation, the mobile type scale and row height, and the Vite host and preview proxy.
- The expanded-row tint is gone, so the rows are white as the design says and the sticky cell has one background. 50 unit cases and 39 browser specs.

Verified
- `check`, `typecheck`, `test` (50 cases) and `test:e2e` (39 specs) pass.
- In a browser at 380px: 12 month rows in the chart, all labelled, the name cell 182px whether the tree is collapsed or expanded, four month columns visible, and the LAN address answers.

Open
- A click on the chevron still leaves the row focus-visible, so the ring can show after a pointer click on the grid.
- The chart still has no data table of its own, and the ARIA tree is read through attributes rather than the accessibility API.

Next
- Walk the ARIA tree in the browser suite and split the bundle.

## code analysis, treegrid navigation and chunk split

Decided
- Fallow runs in CI with default thresholds, health ignores for UI primitives, e2e specs and test files, and default ignores for dead-code and duplication checks.
- Tree traversals collapse to `pathTo`, deriving `findNode` and `ancestorIds`.
- The treegrid keyboard model lives in a pure module (`treegrid-nav.ts`) tested with vitest.
- Pointer clicks suppress the focus-visible ring via `{ focusVisible: false }`, tested on Chromium.
- The bundle splits recharts and vendor chunks manually in Vite, avoiding route lazy loading.

Done
- Fallow config `.fallowrc.jsonc` and CI step in `.github/workflows/ci.yml`.
- Pure `treegrid-nav.ts` with unit tests covering arrow navigation, expand, collapse, parent, Home, End, Enter and Space.
- Chart decomposed into `MonthlyChart`, `ChartPlot` and `useMonthHover`.
- Treegrid decomposed into small row components; rows carry `aria-label={row.name}`.
- State page video playback extracted to `useVideoPlayback`.
- Unused shadcn exports deleted; vendor chunk split added to Vite config.
- Playwright specs for ARIA tree walk across four levels and chevron click without focus ring.

Verified
- `npm run analyze` exits 0.
- `npm run check`, `npm run typecheck`, `npm run test` (66 cases) and `npm run test:e2e` (40 specs) pass.
- Production build has no chunk size warning.

Open
- The chart still has no data table of its own.
- The focus-visible suppression is proven on Chromium only.

Next
- The chart gets a data table of its own.
- The treegrid keyboard model could be extended with Home and End on a collapsed tree if the APG needs it.

## the state page videos carry the name of their state

Decided
- The two clips are named for the state they play on, `not-found.mp4` and `no-data.mp4`, so each sits next to its poster and the folder reads as one set.
- The name says what the file is for and not where the footage came from, so the filenames do not name the show or the actor.

Done
- `git mv` on both clips, so the history follows them, and the imports and the local names in `NotFound.tsx` and `NoData.tsx` follow.
- Biome sorted the imports, so the video comes before the poster in both files.

Verified
- `check`, `typecheck`, `test` (66 cases), `test:e2e` (41 specs) and `build` pass.
- The build emits `not-found-*.mp4` and `no-data-*.mp4`.

Open
- The licence for the footage in a public repository is still open. The names hide the source, the pixels do not.

Next
- Replace the two clips with footage the project owns, or drop the video and keep the poster.
