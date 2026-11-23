# Nevis frontend take-home - advisor book of business

Dashboard for the Nevis Senior Frontend Engineer take-home: advisors and their managers track a book of business over Feb 2024 - Jan 2025, drilling from the whole company down to a branch, an advisor or an acquisition channel. Two parts, a stacked bar chart over time and a per-month detail table with expandable rows.

Review copy. The design and the client figures belong to Nevis; this repository is for their evaluation only.

Task, payload and design links: `docs/brief.md`. Exported design trees and frames: `design/` (gitignored). Decisions made before any code, design facts and the idea backlog: `docs/context.md`.

## Layout

- `apps/web` - Vite + React 19 client.
- `apps/api` - Express API.
- `packages/shared` - Zod contract used by both, and the mock payload.

## Run it

Install once from the root:

```bash
npm install
```

Then:

```bash
npm run dev        # web and api together
npm run dev:web
npm run dev:api

npm run build
npm run test        # vitest, the unit suite under apps/web/src
npm run test:e2e    # playwright, the browser suite under apps/web/e2e
npm run lint
npm run format      # biome format --write: two spaces, 100 columns, sorted imports
npm run check       # biome check: lint, formatting and import order in one pass
npm run typecheck
npm run api:check
npm run analyze    # fallow: dead code, duplication, complexity
```

The web client runs on http://localhost:5173 and the API on http://localhost:3000. `npm run dev` starts both. `npm run api:check` runs the API contract checks against the running server.

The browser suite needs a Chromium build once, `npm exec playwright install chromium`. It starts the API and the dev server itself, so nothing has to be running before it.

CI runs check, typecheck, test and build on every push and pull request, and the browser suite on every push once it has specs. Nothing is deployed: the project runs locally.

## Decisions

The brief asks for the calls made where it left things open, and for anything that looks wrong on their side. One line per decision, with the alternative and the reason.

- Workspaces: npm workspaces with `apps/web`, `apps/api`, `packages/shared`. One install and one lockfile. pnpm is faster at scale but adds a second toolchain for three packages; Bun would replace the Node runtime the brief asks for.
- Styling: Tailwind v4 with shadcn/ui for the two data components and the loading skeleton, CSS modules for the page shell. The shadcn Table, Chart and Skeleton primitives give the markup, so the diff shows the ARIA and the chart wiring rather than a rebuilt table. Tokens live in one file, `apps/web/src/index.css`.
- Type: Inter Variable, self-hosted through `@fontsource-variable/inter`. The design and Nevis' own app both use Inter; Geist ships with shadcn's base preset and was removed. Self-hosting avoids a third-party font request and keeps the build reproducible offline.
- TypeScript: one `tsconfig.base.json` extended by each workspace, `strict` plus `noUncheckedIndexedAccess`. Indexing the payload arrays is the likeliest source of silent bugs in this app.
- Lint: Biome, not ESLint. `typescript-eslint` declares a peer range of `typescript >=4.8.4 <6.1.0`, and this repo is on TypeScript 7, so the usual pairing does not install. Biome parses TypeScript on its own, so it does not depend on the compiler version, and it lints the workspace in milliseconds. The shadcn components under `src/components/ui` are excluded: they are copied from the shadcn CLI and are not ours to restyle.
- Formatting: Biome's formatter, not Prettier. One tool for lint and format, one config that the editor and CI read, and Biome parses TypeScript without the compiler. Prettier would be a second formatter with a second config to keep in step, and the repo has no Prettier dependency today. The config lives at the repo root because that is the file the editor's language server looks for; a nested one under `apps/web` is invisible to it, and a root config beside a nested one is an error for Biome. The style is pinned to the shape the code was already written in: two spaces, 100 columns, double quotes, semicolons. Import order is Biome's `organizeImports` assist, applied on save through `editor.codeActionsOnSave`, so the specifiers in a file are sorted the same way on every machine.
- Tests: vitest for the pure modules under `src/lib`, Playwright for the browser suite in `e2e`. The brief grades how the data maps into the chart, and the chart mapping is a pure function, so that test is a unit test rather than a browser test. The treegrid keyboard model and the hierarchy announcement belong in a browser, where the focus ring and the accessibility tree are real.
- API build: esbuild bundles `apps/api/src/index.ts` into one ESM file, `express` and `zod` external, `@nevis/shared` inlined. `tsc --noEmit` owns the types. Plain `tsc` emit would need a composite project for `shared`, a build order, and a runtime that resolves TypeScript source through the workspace symlink.
- No deploy: the project runs locally with `npm run dev`, and there is no hosted demo. The brief asks for a repository and a README, not a URL. A public copy would need one service serving both the API and the client build, plus a domain and a deploy pipeline, which is setup that shows none of the work being graded.
- Table: native `<table role="treegrid">` with the WAI-ARIA APG rows-first keyboard model, not Accordion or Collapsible over divs. A div grid means rebuilding row, gridcell, header association and hierarchy by hand, then writing the same keyboard layer, and a reviewer reads it as a red flag. No TanStack Table either: flattening twelve rows is fifteen lines and the library does nothing for the part that is graded.
- Chart: shadcn Chart over Recharts 3. Recharts 3.8 keeps its keyboard index on blur, so a second Tab into the chart reopened no tooltip and continued from the old month, and v3 has no controlled active index, so MonthlyChart owns the focus model: focus enters on the first month, resets when it leaves, arrow keys move between months, and the tooltip is driven by a mouse move at the tick position so the library's cursor, tooltip, flipping and animation stay the library's. The treegrid below is the accessible alternative.
- Chart library: Recharts, not ECharts. Nevis' own app draws its charts with ECharts, so matching the house library was the default answer. Recharts was picked because its primitives let us wire arrow-key navigation and a live region for screen readers while keeping the library's cursor, tooltip and animations. That is the part of the brief that is graded, and the part a chart library decides for you. Inside the Nevis codebase this chart would be rebuilt on ECharts with the same series and the same domain rule.
- Chart stacking: the selected node's immediate children, bottom to top in array order. The company stacks its three branches, a branch stacks its advisers, an adviser stacks her channels, and a leaf shows one series named after itself. Channels exist under one adviser, so a channel breakdown higher up the tree has four advisers and two branches with no channel data; stacking the immediate children is the only model the payload supports. A series takes the colour of its position in the stack, so `--chart-1` is Branch 1 in the company view and Anna Blackwood in the Branch 1 view. The scope title names the scope, so the colour follows the series rather than the entity.
- Chart scope: follows the selection, with a title that names the node and the breakdown, and an axis derived from the current stack. The design's Existing clients / New organic / New paid legend appears only under Anna Blackwood, where the bars top out at 38 rather than 350.
- Chart palette: `--chart-1` to `--chart-3` are the design colours #B29DF8, #F4BEB4 and #A75E6E, and `--chart-4` and `--chart-5` are a sky and a sage next to them. Branch 1 stacks five advisers, so five tokens are needed, and the legend puts all five on screen at once at 16px, where they have to stay apart. The design fixes three, and the other two are ours.
- Chart axis: the maximum is the largest stacked month, rounded up to the next hundred above a hundred and to the next ten below it, so the company gives 400, Branch 1 gives 300 and Anna Blackwood gives 40. It comes from the stack and not from the row of the node itself: at May 2024 the company row says 301 and its branches stack to 279, and the axis has to fit the bars.
- Selection: a row click selects, `?node=<id>` records it with `replace`, and the chart remaps. A chevron click expands without selecting, a double-click does both. Selecting the company clears the parameter. An unknown id falls back to the company view, which is why the id is a query parameter and not a path segment.
- Announcement: the live region says the scope in a sentence, "Showing Branch 1, broken down by adviser", built from the same scope title the chart draws above the plot. One module owns the wording, so the announcement and the title cannot drift apart, and the title stays a title while the region says what changed.
- API: one route, keyed by fiscal year. `GET /api/dashboard/:year` returns the company object for that year, which is the payload as given. A malformed year (not four digits starting with 1 or 2) is 400 `{"error":"Invalid year format"}` and a year with no data is 404 `{"error":"Data not found for the given year"}`: a bad parameter and a missing resource are different things, and 400 is the status that says so without needing a defence in front of the Nevis team. The client checks the year in the route before it fetches, so it never sees the 400; the client and the API share one predicate, so neither sends nor accepts a value the other would reject. The chart can be remapped to any node the user picks, so the whole year has to be client-side; a per-node endpoint would add a second contract and a loading state per row for no gain at twelve nodes.
- Year in the path: the fiscal year selects a different payload and can be absent from the URL, so it is a path segment. The selected node is a view of the same payload, so it stays a query parameter. The test: delete the parameter and the URL still names a resource. `/dashboard` names nothing, so it redirects to `/dashboard/2024`; `/dashboard/2024` without `?node=` is still a dashboard.
- Mock data: the payload lives in `packages/shared/src/payload.ts` and is exposed on its own entry point, `@nevis/shared/payload`, so the API serves it and the web tests read the same tree instead of keeping a second copy of the numbers the brief names. The API parses it once at boot into `parsedDataMap`, a `Map` with one entry, FY2024, and that map is the seam a real data source replaces. `getData(2025)` returns undefined and the route answers 404.
- Contract shape: `Company.branches` is optional, like `employees` and `channels`. A company can exist before its first branch, and the dashboard draws that as a leaf instead of failing to parse. The trade-off is real: a response that drops the branches array now passes the schema, so the boot check no longer catches that one kind of drift.
- Client data: SWR, one key per year (`/api/dashboard/${year}`), in-memory cache, no context for data. The revalidation switches are left at SWR's defaults, so the page refetches on focus, on reconnect and on every mount of the key, because the payload can change server-side and a client that only ever reads a cached snapshot shows stale numbers. Two options are passed. `shouldRetryOnError` is a function: a 5xx gets two more tries and a 4xx never gets another, because a response the server meant is final, and a 404 for a fiscal year with no data would otherwise be fetched again and again with a growing backoff for as long as the page was open. A request that never got an answer is retried as well, since nothing came back to be final. A body the client cannot read is not retried: the server did answer, and a body that is not JSON or does not match the contract comes back the same way. `errorRetryCount: 2` bounds it. The status is read off the error by shape rather than by `instanceof ApiError`, because Vite gives the class a new identity under HMR while SWR still holds the old error. A 404 is an empty state, not an error, so the fetcher keeps the status and the page branches on it. `SWRConfig` appears only in tests, for a fresh cache per test.
- Routing: `/` and `/dashboard` redirect in loaders with `replace` to `/dashboard/2024`; `/dashboard/:year` renders the page; `*` renders not found. The redirect is on an incomplete URL only. A four-digit year starting with 1 or 2 always renders, including one with no data; `/dashboard/abc`, `/dashboard/0024` and `/dashboard/3000` are not found rather than redirected, so a typo stays visible, and none of them makes a request.
- Fiscal calendar: one file, `apps/web/src/lib/period.ts`, holds the twelve-month table, `formatMonthLabel`, `formatPeriod` and `currentFiscalYear`. February is first because the fiscal year says so, not because the dataset happens to start there, and the year in the labels comes from the route. Nothing else formats a date.
- Empty year: `/dashboard/2025` renders "No data for fiscal year 2025", a form with a labelled select over fiscal years (2000 to the current one) and a Go button, and a link to `/`. The select always shows a disabled "Select a fiscal year" placeholder and resets on every submit: it is an action, not a display of the current year, which the heading already states. The range is the years the picker offers, not the ones the API holds, so the picker never needs to know what the API holds. A year change uses `push`, so Back returns to the previous year.
- Avatars: a 20px circle with the adviser's initials on adviser rows, coloured with the same `--chart-N` token that adviser's series uses in the chart, so a legend swatch and a row circle match. The payload has no image field and the design's photograph would mean a placeholder route for decoration, and initials avoid the layout shift a late image causes. The circle is the token mixed 25% into the card. The mix is what carries the contrast, not the token: at full strength white on `--chart-1` (#B29DF8) is 2.32:1 and `--foreground` on `--chart-3` (#A75E6E) is 4.21:1, while the mixed swatches read between 14:1 and 18:1 against `--foreground`. One ink for all five tokens in both themes.
- States: the loading and error states are reached by intercepting the route in the browser suite, not by a switch on the API. A query parameter that made the server answer 500 would put fault injection in the product path, and the slow case is one click away in the Network panel's throttling dropdown. The client handles a slow response and a 500 the same way it would in production, which is the point of not faking them in the client.
- Opus delegation: `/opus` and an `Opus:` prefix route a task to Claude Opus 4.6 through the local Antigravity CLI. The plugin lives outside this repo at `~/work/opus-plugin` and is registered in the global OpenCode config, so it loads in every project rather than one. Opus plans in Plan mode and acts in Build mode, read from the session's agent rather than stated in the prompt. A skill cannot register a slash command, and a rule cannot execute anything, so neither covers the trigger. The plugin adds no dependency: opencode supplies the SDK at runtime. Build mode runs Opus with Antigravity's own tools, which do not read `opencode.jsonc`, so `design/**` is protected by instruction there rather than by permission, and one delegation runs at a time per project so two of them cannot write the same tree.

## Data quirks found so far

Arithmetic in the payload does not always close, before any UI is involved:

- Branch 1, Jul 2024 reads 291 in the design's tree frame `0:1498` and 201 in the design's table frame `1:2901`, against 201 in the payload. The payload value is the one that keeps 201 + 92 + 41 = 334, the company total for July.
- May 2024: branches sum to 279 (156 + 87 + 36) against a company value of 301.
- Aug 2024: advisors sum to 216 (38 + 16 + 51 + 58 + 53) against a branch value of 214.
- Anna Blackwood's channels differ from her own row by 1 in May, June, July and September, and by 2 in August. Her 2 in August is the whole of the branch's 2-unit gap that month.

The payload is served as given and nothing is reconciled. The source figures may come from an aggregated query with filters that are not visible here, so correcting a cell would mean inventing a rule for which one is wrong. The chart and the table show the numbers as received, and this section is the only place the disagreement is surfaced.

The design disagrees with itself in one more place. Its chart bars drift from its own table: Sep, Oct, Nov and Dec draw about 12.5 units high where the table says 250, and Jan draws about 14 above 350. The code copies the treatment, the gridlines, the bar shapes and the axis range, and never a value.

## States covered

Loading and error for the first paint, an empty fiscal year, an invalid year, empty depth (branches without employees, advisers without channels), selection and deep links, keyboard-only, 375px.

The first paint is a `role="status"` region named "Loading" with decorative skeletons that hold the space the chart and the table will take. A failure is a `role="alert"` with the message, the status and a Retry button. A failure after the data landed does not replace the page: the message goes above the stale content, and the Retry button goes with it.

The loading and error states are covered by the browser suite, which intercepts the route. To reach them by hand: the Network panel's throttling dropdown for the slow one, and either the same panel's block request URL pattern (`*/api/dashboard/*`) or stopping the API for the error one.

## Accessibility

The hierarchy is a real treegrid: rows carry `aria-level`, `aria-posinset`, `aria-setsize`, `aria-expanded` on parents and `aria-selected` on every row. Right and Left expand and collapse, Enter selects, and focus stays on the row that was toggled. A deep link opens the path to the selected node.

Cells are not focusable, only rows. APG says a treegrid whose cells cannot be focused should be a tree view, and a treeview with columns is only advised when the columns fit without horizontal scrolling. Ours scroll at 375px, so this is a deliberate simplification and the one place the implementation departs from the pattern.

The chart is not the only route to its numbers. The table below holds every level, so any scope the chart can show is readable in text form, and the page announces each scope change in a live region. The chart also carries its own path: it is focusable once, focus always starts at the first month and resets when focus leaves, the arrow keys step through the months, and a polite live region announces the month with one line per series. The companion data table for the chart is still not built.

The adviser circle is decoration and carries `aria-hidden`, because the name sits next to it. The colour is never the only signal: the same adviser is named in the row, in the legend and in the chart tooltip.

## Tests

The split is decided: vitest for the pure modules under `apps/web/src/lib`, Playwright for the browser suite in `apps/web/e2e`. The chart mapping and the tree flattening were pulled out of the components for that reason.

The unit suite is 42 test cases over four files. `chart.test.ts` is the one the brief names: it asserts that the company stacks its three branches, that an adviser stacks her three channels, that a leaf is one series of its own, that the twelve rows carry the months of the year in the route, and that the axis maximum is 400 for the company, 300 for Branch 1 and 40 for Anna Blackwood. `tree.test.ts` asserts the levels, the sibling counts and the kind of each row, and that a branch without employees stays a branch. `period.test.ts` asserts the fiscal calendar, including the year in January. `http.test.ts` asserts status extraction, error transience and `ResponseError` recognition across module re-evaluations.

The browser suite is 16 specs over two files. `treegrid.spec.ts` covers the tree as it renders, the keyboard model, the chevron, the selection remapping the chart, the chart announcing the active month, the deep link, an unknown node and the 375px layout. `states.spec.ts` covers the error, loading, empty-year and invalid-year states, a leading zero not being a year and a year past 2999 not being one either. Two specs (the chevron focus spec and the figure accessible-name spec) were run against the old behaviour on purpose before they were kept; the rest were written with the feature and pass.

## AI use

The three pure modules, the chart component, the treegrid and the page were written with an AI agent in the loop, against task descriptions written by another agent and reviewed against the payload. Three things came out of that review and are in the code: the axis maximum was read off the wrong month in the task, `initials` gave a one-word name two letters, which the unit test caught, and the chevron took the focus when it was clicked, so Enter on it selected the row instead of expanding it. The agent was told the arithmetic in the brief and did not correct a single payload figure.

## What I would do next

- Give the chart a data table of its own, so the numbers are reachable from the chart and not only from the treegrid.
- Split the bundle. Recharts is most of it, and the chart could be loaded on its own route.
- Check the ARIA tree with the accessibility API rather than through attributes. The suite reads the attributes a screen reader would read, and a tree walk would catch what they do not.
