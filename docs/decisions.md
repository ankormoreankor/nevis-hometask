# Assumptions and calls

The brief asks for the calls I made, what I assumed, and anything I think Nevis got wrong. The code and `docs/context.md` carry the rest.

## A row selects, and the chart draws the row's children

The brief asks for drill-down, and expansion alone does not change the chart, so a row click scopes it to that node. The design shows no selected state, so that part is invented. The chart stacks the selected node's immediate children; at May 2024 the branches sum to 279 and the company row says 301, so the chart is a breakdown and the row is the total.

## The fiscal year is a route

`/dashboard/2024` is the page, `/` and `/dashboard` redirect to it, and a valid year with no data renders an empty state with a year picker. A URL that names the period is shareable, and the picker needs somewhere to go. With one year of data the parameter can look like scaffolding.

## February to January is a fiscal year

The twelve values are a fiscal year starting in February, so the labels run Feb 2024 to Jan 2025 and January carries 2025. The brief gives that range and the design labels agree. If the extract merely started in February, the labels still match but the fiscal framing is overreach.

## The payload is served unchanged

Every number is served as received: no correction, no derived totals, no warning badge. The source query and filters are unknown, so a correction would invent a rule about which cell is wrong; the payload does not close in May (279 against 301), in August (216 against 214), or for Anna's channels in five months. Two design frames also disagree on Branch 1, July 2024 (291 against 201), and the payload's 201 closes against 334, so I used it.

## Selection is a query parameter

`?node=<id>` records the selection, and an unknown id falls back to the company. The year selects a different payload, so it is a path segment; the node is a view of the same payload, so it is a query value. Closing a row that contains the selection lifts it to the row, because a hidden row cannot be the scope.

## Below 640px the chart turns horizontal

Twelve month columns at phone width cannot keep 24px targets or their labels, so below 640px the chart stacks along the x axis with months down the y axis. The table pins the name column and shortens the month headers. The brief only requires nothing to break at 375px; this goes further because a chart that drops labels or targets is broken without overflowing.

## What I think you got wrong

The design gives two components and no page around them: no header, page title, navigation or page background, and no loading, empty, error or not-found state. That gap is where most of my calls come from, including the routing, the "Clients" heading, the fiscal period, the breadcrumb above the chart, the page background and the state pages. If the intent was a component study, "closely match the design" does less work than it sounds; if it was a page, the design is missing its frame.

## What I would ask

- What do the figures measure: clients, accounts, revenue or assets?
- Is February to January the reporting year, or just the extract?
- Is row selection wanted, or expansion only?
