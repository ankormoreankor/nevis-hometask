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

The workspace scripts are wired. Vite, TypeScript and the API entry points land next, so the app commands start working as those files are added.

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
- Deploy: one Render web service on the Starter plan, `nevis-hometask.ankormoreankor.com`, Cloudflare in front. A static site plus a separate API would need CORS or a Worker; one service avoids both. Starter for the review month avoids the free tier's one-minute cold start.
- Open: what the chart stacks. Branch values sum to the company row, the design's channel legend does not.
- Open: whether the chart follows the selected drill-down node or always shows the whole company.
- Open: employee avatars appear in the design, the payload carries no image data.

## Data quirks found so far

Arithmetic in the payload does not always close, before any UI is involved:

- Branch 1, Jul 2024 reads 291 in the design against 201 in the payload. The payload value is the one that keeps 201 + 92 + 41 = 334, the company total for July.
- May 2024: branches sum to 279 (156 + 87 + 36) against a company value of 301.
- Aug 2024: advisors sum to 216 (38 + 16 + 51 + 58 + 53) against a branch value of 214.

## States covered

Loading, error, empty, partial depth (branches with no employees, advisors with no channels), keyboard-only, 375px.

## Accessibility

To fill in: hierarchy exposed as a tree or nested table semantics, expand and collapse from the keyboard, focus kept on the toggled row.

## Tests

To fill in: expand and collapse behaviour, data-to-chart mapping.

## AI use

To fill in: what was generated, what was reviewed, what was rejected.

## What I would do next

To fill in, three honest bullets.
