# Project rules

Nevis frontend take-home: dashboard over a company > branch > adviser > channel tree. Standalone repo, no shared config or history with the resume repository.

## Read first, in this order

1. `docs/brief.md` - the brief, the payload, and the five Figma links with node IDs.
2. `docs/context.md` - decisions already made, design facts, data inconsistencies, the idea backlog, constraints.
3. `docs/log.md` - the last two entries: what the previous sessions decided and what to pick up next.
4. `docs/jd.md` - the role this is for.
5. `design/` - node trees (`nodes.json`, query with `jq`, never read whole) and 2x frame renders (`*.png`). Gitignored: employer material, never committed.

## Conventions

- Vite + React 19 + TypeScript strict. `createBrowserRouter`, CSS modules, tokens in one file.
- API: Express in the same repo, thin. Shared Zod schema in `shared/`, imported by server and client.
- Biome owns the formatting: two spaces, 100 columns, double quotes, semicolons, imports sorted. One `biome.json` at the repo root. `npm run format` writes it, `npm run check` is what CI runs.
- Decisions land in the README's `## Decisions` section as they are made, not at the end. The brief grades them.
- Numbers rendered in the UI come from the payload unchanged. Where a level is missing (branches without employees, advisers without channels), the row is a leaf and says so.
- UI copy is plain and factual: no em dashes, no marketing adjectives, no exclamation.

## Who writes what

Configuration belongs to the agent. Implementation belongs to the user.

The agent writes without asking:

- config: `opencode.jsonc`, root and workspace `package.json`, `package-lock.json`, tsconfig files, Vite, ESLint, Vitest, Playwright, CI workflows, `.gitignore`, `.editorconfig`
- docs: `README.md`, `AGENTS.md`, `docs/context.md`, `docs/task-template.md`
- scaffolding: folders, empty files, `.gitkeep`, placeholder exports

The agent stops before implementation under `apps/**` and `packages/**`: components, routes, API handlers, schemas, styles, tests. It writes the task into the file that needs the code, as a comment block at the top, and leaves the smallest placeholder that compiles. Frontend tasks assume a senior frontend developer and state the contract only. Backend tasks assume a junior and spell out the Express and Zod mechanics. Format and calibration: `docs/task-template.md`.

Direct request overrides this. If the user says "build X", the agent builds X and writes no task.

Nothing in `opencode.jsonc` gates these edits. The split is a rule the agent follows, checked against the diff. `design/`, `docs/brief.md` and `docs/jd.md` stay denied at the config level because they are employer material.

## Opus delegation

`/opus <task>` and a message starting with `Opus:` hand the task to Claude Opus 4.6 through the local Antigravity CLI. The plugin is installed globally at `~/work/opus-plugin` and registered in `~/.config/opencode/opencode.jsonc`, so it is available in every project; the prompt hook there rewrites the prefix into an `ask_opus` call, and `opus.sh` beside it owns the `agy` flags. The mode comes from the session's agent: plan in Plan mode, build in Build mode. One delegation runs at a time per project, and a nested delegation is refused. Opus cannot see this conversation: pass the whole task.

## Project log

`docs/log.md` is the session log: what happened, what was decided, what is next. It is the only channel that survives a session change. It is committed with the repo. If it is missing, create it.

- Read the last two entries at the start of a session, after `docs/context.md`.
- Write on an explicit trigger: `/log`, or the user saying "log it". Nothing else. The agent cannot detect the end of a session, and guessing produces entries nobody asked for.
- One entry per trigger. A short title, then `Decided`, `Done`, `Verified`, `Open`, `Next`. Leave out a heading when it is empty. Twelve lines is the target. No dates.
- Append-only. To change a past decision, write a new entry that supersedes it. Do not edit the old one.
- `docs/context.md` stays the current truth. The log is the history. When they disagree, `context.md` wins and the log says why it changed.

## Working notes

- Match the design's visual treatment, not its pixel positions: its chart bars disagree with its own table.
- Check arithmetic against the payload before calling a design value a bug. `docs/context.md` lists the three already found.
- Budget is 6-8 hours. Ship fewer things properly; state what was cut.
