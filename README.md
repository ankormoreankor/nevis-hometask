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
- Chart stacking: the three branches, bottom to top. Branch values sum to the company row in every month but May, while the design's channel legend is illustrative: channels exist under one adviser and reach 27 against a company bar of 350. The legend names the branches and the colours keep the design palette.
- Chart scope: fixed at company level. Expanding a row in the table does not change the chart, because its series are the branches from the first response.
- API: `GET /api/dashboard` returns the company and its branches; `GET /api/nodes/:id/children` returns one level. Expansion never changes a query parameter: the node id is the path and the cache key, and a `?nodeId=&depth=` pair cannot describe two open rows at once.
- Client data: SWR, one key per request, in-memory cache, no context for data. `revalidateIfStale: false` means a collapsed row reopens from cache with no request, and `shouldRetryOnError: false` lets the error demo settle. `SWRConfig` appears only in tests, for a fresh cache per test.
- Lazy levels: the first paint is the company plus its branches, because the chart stacks branches. A branch or adviser row fetches its children on expand and shows one skeleton row while it loads.
- Routing: `/dashboard` is canonical and `/` redirects in a loader with `replace`, so Back leaves the app instead of bouncing. One URL for one screen, with a named path that leaves room for a second route.
- Avatars: initials circles for advisers, no image field in the payload and no extra endpoint. The design shows photographs; serving them would mean a placeholder route for decoration, and initials avoid the layout shift a late image causes.

## Data quirks found so far

Arithmetic in the payload does not always close, before any UI is involved:

- Branch 1, Jul 2024 reads 291 in the design against 201 in the payload. The payload value is the one that keeps 201 + 92 + 41 = 334, the company total for July.
- May 2024: branches sum to 279 (156 + 87 + 36) against a company value of 301.
- Aug 2024: advisors sum to 216 (38 + 16 + 51 + 58 + 53) against a branch value of 214.

## States covered

Loading and error for the first paint and for each expanded level, empty depth (branches without employees, advisers without channels), keyboard-only, 375px.

## Accessibility

To fill in: hierarchy exposed as a tree or nested table semantics, expand and collapse from the keyboard, focus kept on the toggled row.

## Tests

To fill in: expand and collapse behaviour, data-to-chart mapping.

## AI use

To fill in: what was generated, what was reviewed, what was rejected.

## What I would do next

To fill in, three honest bullets.
