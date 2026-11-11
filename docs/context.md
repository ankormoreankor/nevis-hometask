# Working context

Everything a fresh session needs to be as oriented as the session that set this repo up. Read alongside `brief.md` (the task and payload) and `jd.md` (the role).

## The task in one paragraph

A dashboard for a wealth adviser's book of business. Two parts: a stacked bar chart over Feb 2024 - Jan 2025, and a per-month table with rows that expand one level at a time (company > branch > adviser > acquisition channel). React and TypeScript, data served by a Node REST API, loading and error states handled, keyboard-operable expansion, hierarchy exposed to assistive tech, tests for expand/collapse and for how data maps into the chart, nothing broken at 375px, README with assumptions and open questions. Budget 6-8 hours.

## What is already decided

- **Frontend:** Vite, React 19, TypeScript strict, `createBrowserRouter`, CSS modules with a token file. Same shape as the employer's own app.
- **Backend:** Express, in the same repo, deliberately thin. `GET /api/book` returns the payload; `GET /api/health`; `?simulate=slow|error` behind the same routes so loading and error states can be demonstrated in the reviewer's browser.
- **Contract:** one Zod schema in `shared/`, used by the server to validate its own response and by the client to type the parsed data. No duplicated interfaces.
- **Deploy:** one service. Express serves the built client and the API from the same origin, so no CORS and no base URL. In dev, Vite proxies `/api` to the API port.
- **Data:** the payload is the source of truth, served unchanged. A repository module (`getBook()`) keeps the swap to a real database to one file, and the README says so in a sentence instead of shipping a database that holds twelve numbers.

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
- Adviser rows carry a 24px circular avatar; branch and company rows do not. Channel rows sit one indent deeper with no chevron and no avatar, and are leaves.
- Expansion is chevron-only, and only rows with children get a chevron.

Two design issues to resolve in code and record in the README:

1. **The chart legend does not match the data.** It names Existing clients / New organic / New paid, but channels exist only under one adviser, whose August total is 27 against a bar that reaches 350. The design's segments sum to roughly company-scale values, so the legend is illustrative. Branch values do sum to the company row. Decide what the stack represents and say why.
2. **The design's bars drift from its own table** by up to about 12 units in Sep and Jan, so match the visual treatment rather than pixel positions.

## Data facts

Arithmetic in the payload, verified:

- Branch 1, Jul 2024 is 291 in the design and 201 in the payload. 201 + 92 + 41 = 334, the company figure, so the payload is right and the design has a typo.
- May 2024: branches sum to 279 (156 + 87 + 36), company says 301.
- Aug 2024: advisers sum to 216, branch says 214.
- Channels sum to their adviser in every month. Adviser totals match their branch except in August.

Decide and document: serve the payload as given, or surface the mismatch. Either is defensible; silence is not.

## Ideas worth building, in order of value

1. **Keyboard and screen-reader parity for the chart.** Not just the table: expose the same numbers through a companion data table or a focusable bar series with an accessible description. Almost no take-home does this and their interview bank asks about keyboard access to charted data.
2. **Expansion state in the URL.** `useSearchParams` so an open row survives reload and can be linked. Cheap, and it is the kind of thing a data product needs.
3. **`?simulate=slow|error`.** Makes the loading, retry and error states reviewable without touching code. Document the switch next to the live link.
4. **Tests the brief names**, plus one for branches without employees and one for the chart mapping (payload values to segment totals and axis scale).
5. **A data-quality note** in the README, with a UI decision behind it: a footnote, a tooltip, or a dev-only badge on inconsistent months.
6. **Avatars served by id.** `GET /api/advisors/:id/avatar`, 404 when absent, initials fallback in the UI, empty `alt` because the name is adjacent, no layout shift, cache headers. Keys are stable, so production can put the same paths behind a CDN with signed URLs; note that in one line rather than building the bucket.
7. **Formatting:** `Intl` for month labels and numbers, tabular figures in the table so columns align, and a horizontal scroll container rather than squeezed columns at 375px.
8. **States:** pending per row, error per row with retry, empty depth, reduced motion.

Stretch, only after the above: lazy child fetching. `GET /api/book?nodeId=&depth=` so expanding a branch loads its children, cached after the first fetch, with per-row loading and a failure that does not break the rest of the table. Roughly 1.5 hours and it exercises API design plus per-row async state.

## Constraints to check before calling it done

- [ ] React and TypeScript, Node REST API, loading and error states
- [ ] Component APIs composable, with clear boundaries
- [ ] Expand and collapse from the keyboard only, hierarchy announced to assistive tech
- [ ] Tests: expand/collapse, data-to-chart mapping
- [ ] Nothing overflows or breaks at 375px
- [ ] README: run, test, assumptions, open questions, what next
- [ ] No console errors, no unused dependencies

## Open questions to answer in the README

- What the chart stacks, and what happens to the chart when a row is expanded.
- Whether numbers are counts, money or something else. The brief says figures; the design shows plain integers.
- What to do with months whose totals disagree across levels.
- Whether the table shows all four levels at once or only the path that is open.
