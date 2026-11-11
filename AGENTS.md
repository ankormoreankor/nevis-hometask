# Project rules

Nevis frontend take-home. Standalone repo inside `resume-builder/sandbox/`, with no shared config or history with the parent repository.

## Source of truth

- `docs/brief.md` - the brief, the payload, the five Figma links, and the node IDs.
- `design/nodes.json` - full Figma node trees for the chart and the three table states. Query it with `jq`, never read it whole.
- `design/*.png` - 2x renders of those five frames. Open the image rather than inferring layout from the JSON.

`design/` is gitignored: employer material, never committed. Same for `.env*`.

## Conventions

- React + TypeScript, strict. The API is Node, in the same repo, started by a separate script.
- Decisions go into the README's `## Decisions` section as they are made, not at the end. The brief grades them.
- Numbers shown in the UI come from the payload unchanged. Where a level is missing (branches without employees, advisors without channels), the row is a leaf and says so.
- Copy that ships in the UI is plain and factual: no em dashes, no marketing adjectives.

## Working notes

- The design's chart bars drift from its own table, so match the visual treatment rather than pixel positions.
- Verify arithmetic against the payload before treating a design value as a bug. `README.md` lists the ones already found.
