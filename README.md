# Nevis frontend take-home - advisor book of business

Dashboard for the Nevis Senior Frontend Engineer take-home: advisors and their managers track a book of business over Feb 2024 - Jan 2025, drilling from the whole company down to a branch, an advisor or an acquisition channel. Two parts, a stacked bar chart over time and a per-month detail table with expandable rows.

Review copy. The design and the client figures belong to Nevis; this repository is for their evaluation only.

Task, payload and design links: `docs/brief.md`. Exported design trees and frames: `design/` (gitignored).

## Run it

Not built yet. Commands land here once the app exists: install, dev server, API, tests.

## Decisions

The brief asks for the calls made where it left things open, and for anything that looks wrong on their side. One line per decision, with the alternative and the reason.

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
