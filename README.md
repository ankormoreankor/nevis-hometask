# Nevis frontend take-home - advisor book of business

Dashboard for the Nevis Senior Frontend Engineer take-home: advisors and their managers track a book of business over Feb 2024 - Jan 2025, drilling from the whole company down to a branch, an advisor or an acquisition channel. Two parts, a stacked bar chart over time and a per-month detail table with expandable rows.

Review copy. The design and the client figures belong to Nevis; this repository is for their evaluation only.

Task, payload and design links: `docs/brief.md`. Exported design trees and frames: `design/` (gitignored). Decisions made before any code, design facts and the idea backlog: `docs/context.md`.

## Layout

- `apps/web` - Vite + React 19 client.
- `apps/api` - Express API.
- `packages/shared` - Zod contract used by both.

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
npm run test
npm run lint
npm run typecheck
npm run analyze    # fallow: dead code, duplication, complexity
```

The web client runs on http://localhost:5173 and the API on http://localhost:3000. `npm run dev` starts both. The API entry points are task blocks for now, so the API process starts and exits until the code in `apps/api/src/index.ts` and `packages/shared/src/index.ts` replaces the placeholders.

## Deploy

One Render web service on the Starter plan, with Cloudflare in front. The service builds the workspace, starts the API, and the API serves the built client from `apps/web/dist`.

- Live: https://nevis-hometask.ankormoreankor.com
- Blueprint: `render.yaml`
- CI: `.github/workflows/ci.yml`

First setup:

1. Create a Render Blueprint from this repository. Render reads `render.yaml`.
2. Add a Cloudflare CNAME: `nevis-hometask` -> `nevis-hometask.onrender.com`, proxy on, SSL mode Full (strict).
3. Copy the Render deploy hook URL and add it to the GitHub repository as the `RENDER_DEPLOY_HOOK_URL` secret.
4. Push to `main`. CI runs the checks; the deploy job triggers Render only when they pass.

Render auto-deploy is off in the blueprint. GitHub Actions owns the deploy.

Production notes: the API binds `0.0.0.0` on `PORT`, serves `apps/web/dist`, and exposes `/api/health` for the Render health check. The API build bundles `@nevis/shared`, so the runtime does not resolve TypeScript source. Hashed assets are cached for a year, `index.html` and `/api` are not.

## Decisions

The brief asks for the calls made where it left things open, and for anything that looks wrong on their side. One line per decision, with the alternative and the reason.

- Workspaces: npm workspaces with `apps/web`, `apps/api`, `packages/shared`. One install and one lockfile. pnpm is faster at scale but adds a second toolchain for three packages; Bun would replace the Node runtime the brief asks for.
- Styling: Tailwind v4 with shadcn/ui for the two data components, CSS modules for the page shell. The shadcn Table and Chart primitives give the markup, so the diff shows the ARIA and the chart wiring rather than a rebuilt table. Tokens live in one file, `apps/web/src/index.css`.
- Type: Inter Variable, self-hosted through `@fontsource-variable/inter`. The design and Nevis' own app both use Inter; Geist ships with shadcn's base preset and was removed. Self-hosting avoids a third-party font request and keeps the build reproducible offline.
- TypeScript: one `tsconfig.base.json` extended by each workspace, `strict` plus `noUncheckedIndexedAccess`. Indexing the payload arrays is the likeliest source of silent bugs in this app.
- API build: esbuild bundles `apps/api/src/index.ts` into one ESM file, `express` and `zod` external, `@nevis/shared` inlined. `tsc --noEmit` owns the types. Plain `tsc` emit would need a composite project for `shared`, a build order, and a runtime that resolves TypeScript source through the workspace symlink.
- Deploy: one Render web service on the Starter plan, `nevis-hometask.ankormoreankor.com`, Cloudflare in front. A static site plus a separate API would need CORS or a Worker; one service avoids both. Starter for the review month avoids the free tier's one-minute cold start.
- Table: native `<table role="treegrid">` with the WAI-ARIA APG rows-first keyboard model, not Accordion or Collapsible over divs. A div grid means rebuilding row, gridcell, header association and hierarchy by hand, then writing the same keyboard layer, and a reviewer reads it as a red flag. No TanStack Table either: flattening twelve rows is fifteen lines and the library does nothing for the part that is graded.
- Chart: shadcn Chart over Recharts 3. `accessibilityLayer` is on by default and passed explicitly, so a Recharts upgrade cannot turn it off silently. The treegrid below is the accessible alternative: `role="application"` is a blunt instrument, and the table carries the same figures with real table semantics.
- Chart stacking: the selected node's immediate children, bottom to top in array order. The company stacks its three branches, a branch stacks its advisers, an adviser stacks her channels, and a leaf shows one series named after itself. Channels exist under one adviser, so a channel breakdown higher up the tree has four advisers and two branches with no channel data; stacking the immediate children is the only model the payload supports.
- Chart scope: follows the selection, with a title that names the node and the breakdown, and an axis derived from the current stack. The design's Existing clients / New organic / New paid legend appears only under Anna Blackwood, where the bars top out at 38 rather than 350.
- Selection: a row click selects, `?node=<id>` records it with `replace`, and the chart remaps. A chevron click expands without selecting, a double-click does both. Selecting the company clears the parameter. An unknown id falls back to the company view, which is why the id is a query parameter and not a path segment.
- API: one route, keyed by fiscal year. `GET /api/dashboard/:year` returns the company object for that year, which is the payload as given, or 404 `{"error":"No data for this year"}`. A malformed year is the same 404: there is no path that means "a dashboard without a year", so no 400 exists. The chart can be remapped to any node the user picks, so the whole year has to be client-side; a per-node endpoint would add a second contract and a loading state per row for no gain at twelve nodes.
- Year in the path: the fiscal year selects a different payload and can be absent from the URL, so it is a path segment. The selected node is a view of the same payload, so it stays a query parameter. The test: delete the parameter and the URL still names a resource. `/dashboard` names nothing, so it redirects to `/dashboard/2024`; `/dashboard/2024` without `?node=` is still a dashboard.
- Mock data: `dataByYear` is a `Map` with one entry, FY2024, parsed once at module scope into a `Map<number, Company>`. The map is the seam a real data source replaces, and the README says it holds one year on purpose. `getData(2025)` returns null and the route answers 404, so the empty state is real rather than simulated.
- Client data: SWR, one key per year (`/api/dashboard/${year}`), in-memory cache, no context for data. `revalidateIfStale: false` because a fiscal year's payload is a fixed snapshot, and `shouldRetryOnError: false` so the error demo settles. A 404 is an empty state, not an error, so the fetcher keeps the status and the page branches on it. `SWRConfig` appears only in tests, for a fresh cache per test.
- Routing: `/` and `/dashboard` redirect in loaders with `replace` to `/dashboard/2024`; `/dashboard/:year` renders the page; `*` renders not found. The redirect is on an incomplete URL only. A valid four-digit year always renders, including one with no data, and `/dashboard/abc` is not found rather than a redirect, so a typo stays visible.
- Fiscal calendar: one file, `apps/web/src/lib/period.ts`, holds the twelve-month table, `formatMonthLabel`, `formatPeriod` and `currentFiscalYear`. February is first because the fiscal year says so, not because the dataset happens to start there, and the year in the labels comes from the route. Nothing else formats a date.
- Empty year: `/dashboard/2025` renders "No data for fiscal year 2025", a form with a labelled select over valid fiscal years (2000 to the current one) and a Go button, and a link to `/`. The select always shows a disabled "Select a fiscal year" placeholder and resets on every submit: it is an action, not a display of the current year, which the heading already states. The range is valid years, not populated ones, so the picker never needs to know what the API holds. A year change uses `push`, so Back returns to the previous year.
- Avatars: a 20px circle with the adviser's initials on adviser rows, coloured with the same `--chart-N` token that adviser's series uses in the chart, so a legend swatch and a row circle match. The payload has no image field and the design's photograph would mean a placeholder route for decoration, and initials avoid the layout shift a late image causes. The circle is the token mixed 25% into the card: white on `--chart-1` is under 2:1 and dark on `--chart-3` is under 4:1, so one ink works for all five tokens.

## Data quirks found so far

Arithmetic in the payload does not always close, before any UI is involved:

- Branch 1, Jul 2024 reads 291 in the design against 201 in the payload. The payload value is the one that keeps 201 + 92 + 41 = 334, the company total for July.
- May 2024: branches sum to 279 (156 + 87 + 36) against a company value of 301.
- Aug 2024: advisors sum to 216 (38 + 16 + 51 + 58 + 53) against a branch value of 214.
- Anna Blackwood's channels differ from her own row by 1 in May, June, July and September, and by 2 in August. Her 2 in August is the whole of the branch's 2-unit gap that month.

The payload is served as given and nothing is reconciled. The source figures may come from an aggregated query with filters that are not visible here, so correcting a cell would mean inventing a rule for which one is wrong. The chart and the table show the numbers as received, and this section is the only place the disagreement is surfaced.

## States covered

Loading and error for the first paint, an empty fiscal year, an invalid year, empty depth (branches without employees, advisers without channels), selection and deep links, keyboard-only, 375px.

## Accessibility

The hierarchy is a real treegrid: rows carry `aria-level`, `aria-posinset`, `aria-setsize`, `aria-expanded` on parents and `aria-selected` on every row. Right and Left expand and collapse, Enter selects, and focus stays on the row that was toggled. A deep link opens the path to the selected node.

Cells are not focusable, only rows. APG says a treegrid whose cells cannot be focused should be a tree view, and a treeview with columns is only advised when the columns fit without horizontal scrolling. Ours scroll at 375px, so this is a deliberate simplification and the one place the implementation departs from the pattern.

The chart is not the only route to its numbers. The table below holds every level, so any scope the chart can show is readable in text form, and the page announces each scope change in a live region.

The adviser circle is decoration and carries `aria-hidden`, because the name sits next to it. The colour is never the only signal: the same adviser is named in the row, in the legend and in the chart tooltip.

## Tests

To fill in: expand and collapse behaviour, data-to-chart mapping.

## AI use

To fill in: what was generated, what was reviewed, what was rejected.

## What I would do next

To fill in, three honest bullets.
