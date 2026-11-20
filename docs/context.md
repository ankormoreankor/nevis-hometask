# Working context

Everything a fresh session needs to be as oriented as the session that set this repo up. Read alongside `brief.md` (the task and payload) and `jd.md` (the role).

## The task in one paragraph

A dashboard for a wealth adviser's book of business. Two parts: a stacked bar chart over Feb 2024 - Jan 2025, and a per-month table with rows that expand one level at a time (company > branch > adviser > acquisition channel). React and TypeScript, data served by a Node REST API, loading and error states handled, keyboard-operable expansion, hierarchy exposed to assistive tech, tests for expand/collapse and for how data maps into the chart, nothing broken at 375px, README with assumptions and open questions. Budget 6-8 hours.

## What is already decided

- **Frontend:** Vite, React 19, TypeScript strict, `createBrowserRouter`. The dashboard is `/dashboard/:year`; `/` and `/dashboard` redirect in a loader to `/dashboard/2024`, replacing the entry. A valid four-digit year always renders, including one with no data; `/dashboard/abc` is not found. Tailwind v4 and shadcn/ui for the two data components, CSS modules for the page shell, tokens in `apps/web/src/index.css`. Same shape as the employer's own app.
- **Table:** `TreeGrid`, a native `<table role="treegrid">` with the WAI-ARIA APG rows-first keyboard model. Not Accordion or Collapsible over divs, not TanStack Table. Rows are the only focus target; cells are not, which is a stated deviation from APG. Expansion is local state, selection is `?node=<id>`.
- **Avatars:** a 20px circle with the adviser's initials on adviser rows, coloured with the same `--chart-N` token that adviser's series uses in the chart, so a legend swatch and a row circle match. The circle is the token mixed 25% into the card, because white on `--chart-1` is under 2:1 and dark on `--chart-3` is under 4:1, so one ink works for all five tokens. The payload has no image field, so the design's photograph is not served.
- **Chart:** `MonthlyChart`, shadcn Chart over Recharts 3 with `accessibilityLayer`. It stacks the selected node's immediate children: branches, then advisers, then channels, and a single series for a leaf. The title and the axis follow the scope, the month labels follow the year in the route. The treegrid is the accessible alternative.
- **Selection:** a row click selects and the chart remaps. A chevron click expands without selecting, a double-click does both. The URL records the selection with `replace`, so a drill is shareable and Back leaves the dashboard.
- **Backend:** Express, in the same repo, deliberately thin. `GET /api/dashboard/:year` returns the payload object itself; a malformed year is 400 `{"error":"Invalid year format"}` and a year with no data is 404 `{"error":"Data not found for the given year"}`; `GET /api/health`; `?simulate=slow|error` on the data route so loading and error states can be demonstrated in the reviewer's browser. One route, because the chart can be remapped to any node and the whole tree is twelve nodes.
- **Contract:** one Zod contract in `shared/`, holding the four source schemas, their types and a `TreeNode` union. The server validates what it sends, the client parses what it receives, and no interface is duplicated. There are no response schemas: the wire shape is the payload. No month labels either: the wire carries twelve bare numbers and the fiscal calendar is presentation. `Company.branches` is optional alongside `employees` and `channels`: a node without children is a leaf, and the client never assumes three branches.
- **Client data:** SWR, one key per year, in-memory cache, no context for data. `revalidateIfStale: false` because a fiscal year's payload is a fixed snapshot. A 404 is an empty state, not an error, so the fetcher keeps the status and the page branches on it.
- **Fiscal calendar:** `apps/web/src/lib/period.ts` holds the twelve-month table, `formatMonthLabel`, `formatPeriod` and `currentFiscalYear`. February is first because the fiscal year says so; the year in the labels comes from the route.
- **Empty year:** `/dashboard/2025` renders a heading with the year, a form with a labelled select over 2000 to the current fiscal year and a Go button, and a link to `/`. The select always shows a disabled placeholder and resets on every submit: it is an action, not a display of the current year. The range is valid years, not populated ones, so no endpoint is needed. A year change uses `push`.
- **Deploy:** none. The project runs locally with `npm run dev`; there is no hosted demo, so no CORS question, no base URL and no deploy pipeline. In dev, Vite proxies `/api` to the API port.
- **Data:** the payload is the source of truth, served unchanged. `dataByYear` is a `Map` with one entry, FY2024, parsed once at module scope; `getData(year)` returns that tree or null. No projections, no corrections, no derived totals: the source query and filters are unknown, so a correction would be invented. Moving to a real database touches one file.

The API is a prop for this exercise, not the deliverable. Keep it small, spend the hours on the UI.

## Employer context that shapes decisions

- Nevis sells an AI wealth management platform to financial advisers: CRM, meeting intelligence, planning, custodian workflows, agents. Around 70 people, Series B, US data residency, SOC 2 Type II, tenant isolation, audit trails.
- Their production frontend (public bundle, inspected 2026-10-28): React 19.2, `createBrowserRouter` with lazy route chunks, Vite-style asset graph on rolldown, CSS modules per component, in-house token palette, Inter, ECharts for charts, TipTap, Zod v4 behind a schema-driven form runtime, Sentry, Amplitude.
- What that implies for this build: dense tables and charts are their daily work, design tokens over a component library, typed schemas as contracts, keyboard and audit thinking in a compliance-bound product. Vite and react-router are the expected tooling; SCSS appears in the JD, CSS modules in the app.

## Design facts from the Figma pull

File `1qKUKrXJEGzIUoryLIOlJ7`, five frames, node trees and 2x renders in `design/` (gitignored).

| Frame | Node | Size at 1x |
|---|---|---|
| Chart | `1:2814` | 1408x430 |
| Table | `1:2901` | 1408x280 |
| Tree, collapsed | `0:1492` | 1408x224 |
| Tree, branch open | `0:1498` | 1408x504 |
| Tree, adviser open with channels | `0:1450` | 1408x224 |

- Chart: y axis 0-400, gridlines every 100, twelve month labels, legend under the plot. Bars have rounded tops, 88px columns at 1408 width.
- Table: header row with month labels, then company and branch rows. Chevron in the first cell, name beside it, numbers in month columns. Rows about 56px.
- Adviser rows carry a 20px circular avatar with a photograph in it; branch and company rows do not. Channel rows sit one indent deeper with no chevron and no avatar, and are leaves.
- Expansion is chevron-only, and only rows with children get a chevron.

Two design issues to resolve in code and record in the README:

1. **The chart legend does not match the data.** It names Existing clients / New organic / New paid at company scale, but channels exist only under one adviser, where the bars top out at 38. The legend is illustrative. Resolved: the chart stacks the selected node's children, so those three names appear only when Anna Blackwood is selected.
2. **The design's bars drift from its own table** by up to about 12 units in Sep and Jan, so match the visual treatment rather than pixel positions.

## Data facts

Arithmetic in the payload, verified:

- Branch 1, Jul 2024 is 291 in the design and 201 in the payload. 201 + 92 + 41 = 334, the company figure, so the payload is right and the design has a typo.
- May 2024: branches sum to 279 (156 + 87 + 36), company says 301.
- Aug 2024: advisers sum to 216, branch says 214.
- Anna Blackwood's channels differ from her own row by 1 in May, June, July and September, and by 2 in August. Her 2 in August is the whole of the branch's 2-unit gap that month. Every other channel month matches, and every other adviser matches their branch.

Settled: the payload is served as given. The source query and filters are unknown, so correcting a cell would mean inventing a rule for which one is wrong. The mismatches are recorded in the README and nowhere else.

## Ideas worth building, in order of value

1. **Keyboard and screen-reader parity for the chart.** Not just the table: expose the same numbers through a companion data table or a focusable bar series with an accessible description. Almost no take-home does this and their interview bank asks about keyboard access to charted data.
2. **`?simulate=slow|error`.** Makes the loading, retry and error states reviewable without touching code. Document the switch in the README.
3. **Tests the brief names**, plus one for branches without employees and one for the chart mapping (payload values to segment totals and axis scale).
4. **A data-quality note** in the README, with a UI decision behind it: a footnote, a tooltip, or a dev-only badge on inconsistent months.
5. **Formatting:** `Intl` for month labels and numbers, tabular figures in the table so columns align, and a horizontal scroll container rather than squeezed columns at 375px.
6. **States:** empty depth, reduced motion, a slow response that resolves after the page moved on.

## Constraints to check before calling it done

- [ ] React and TypeScript, Node REST API, loading and error states
- [ ] Component APIs composable, with clear boundaries
- [ ] Expand and collapse from the keyboard only, hierarchy announced to assistive tech
- [ ] Tests: expand/collapse, data-to-chart mapping
- [ ] Nothing overflows or breaks at 375px
- [ ] README: run, test, assumptions, open questions, what next
- [ ] No console errors, no unused dependencies

## Open questions to answer in the README

- Whether numbers are counts, money or something else. The brief says figures; the design shows plain integers.
