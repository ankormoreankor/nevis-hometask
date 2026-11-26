# Project rules

Nevis frontend take-home: dashboard over a company > branch > adviser > channel tree.

## Read first, in this order

1. `docs/brief.md` - the brief, the payload, and the five Figma links with node IDs.
2. `docs/context.md` - decisions already made, design facts, data inconsistencies, the idea backlog, constraints.
3. `docs/log.md` - the last two entries, if the file exists: what the previous sessions decided and what to pick up next.
4. `design/` - node trees (`nodes.json`, query with `jq`, never read whole) and 2x frame renders (`*.png`). Gitignored: employer material, never committed.

## Conventions

- Vite + React 19 + TypeScript strict. `createBrowserRouter`, CSS modules, tokens in one file.
- API: Express in the same repo, thin. Shared Zod schema in `shared/`, imported by server and client.
- Biome owns the formatting: two spaces, 100 columns, double quotes, semicolons, imports sorted. One `biome.json` at the repo root. `npm run format` writes it, `npm run check` is what CI runs.
- Decisions land in `docs/context.md` as they are made, not at the end; the calls and the assumptions behind them live in `docs/decisions.md`. The brief grades them.
- Numbers rendered in the UI come from the payload unchanged. Where a level is missing (branches without employees, advisers without channels), the row is a leaf and says so.
- UI copy is plain and factual: no em dashes, no marketing adjectives, no exclamation.

## Accessibility

Accessibility is a constraint, not a pass at the end. WCAG 2.2 AA is the floor. Every interactive control is reachable by keyboard, has a visible focus ring and an accessible name; icon-only buttons carry the name, not the icon. Any motion that starts on its own honours prefers-reduced-motion and can be paused, stopped or hidden, and a loop longer than five seconds gets a control. Meaning never lives in colour, motion or position alone. Targets are at least 24 by 24 pixels. Structure is announced: landmarks, one h1, and hierarchy in the treegrid. A missing keyboard path is a bug, not a polish item.

## Project log

`docs/log.md` is the session log: what happened, what was decided, what is next. It is the only channel that survives a session change. It is local and gitignored, so a fresh clone does not have it. If it is missing, create it.

- Read the last two entries at the start of a session, after `docs/context.md`.
- Write on an explicit trigger: `/log`, or the user saying "log it". Nothing else. The agent cannot detect the end of a session, and guessing produces entries nobody asked for.
- One entry per trigger. A short title, then `Decided`, `Done`, `Verified`, `Open`, `Next`. Leave out a heading when it is empty. Twelve lines is the target. No dates.
- Append-only. To change a past decision, write a new entry that supersedes it. Do not edit the old one.
- `docs/context.md` stays the current truth. The log is the history. When they disagree, `context.md` wins and the log says why it changed.

## Working notes

- Match the design's visual treatment, not its pixel positions: its chart bars disagree with its own table.
- Check arithmetic against the payload before calling a design value a bug. `docs/context.md` lists the three already found.
- Budget is 6-8 hours. Ship fewer things properly; state what was cut.
