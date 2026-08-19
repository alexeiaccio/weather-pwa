# Wayfinder tracker (local markdown)

This repo uses the **local-markdown** issue tracker (no external tracker configured).
Conventions mirror the canon tracker in `~/github/spectre-pwa/.wayfinder/README.md`.

## Efforts

- **Weather · iOS 27 clone on the Mind One**: `.wayfinder/weather/map.md` (charting).

## Where things live

- **The map**: `.wayfinder/<effort>/map.md` — single source of the effort's destination + index of decisions.
- **Tickets**: `.wayfinder/<effort>/tickets/NNN-slug.md` — one file per decision ticket, child of the map.
- **Research reports**: `.wayfinder/<effort>/research/<slug>.md` — findings capture for research tickets.
- **Prototypes**: `.wayfinder/<effort>/prototypes/` — throwaway artifacts created to raise a decision's fidelity.

## Ticket file shape

```markdown
---
id: W<NN>
title: <name>
type: research | prototype | grilling | task
status: open | in_progress | closed | out_of_scope
blocked_by: [W<n>]
assigned: <who>
---

## Question
<the decision or investigation this ticket resolves>
```

## Ops

- **Claim**: set `assigned` in the ticket file *before* starting work.
- **Resolve**: append a `## Resolution` section, set `status: closed`, then append one line to the map's *Decisions so far* pointing at the ticket by name+link.
- **Blocking**: open tickets list blocked ids in frontmatter; an unblocked+open ticket is on the frontier.
- **Frontier query**: open tickets whose `blocked_by` are all closed.