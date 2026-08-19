---
id: W6
title: Offline and refresh strategy
type: grilling
status: open
blocked_by: []
assigned:
---

## Question

What happens when the Mind One has no network — and how often does the app refresh?

Weather is live data, unlike Spectre's offline-only cipher. Options:

- **Online-first, stale-while-revalidate** — show cached last-known data instantly, fetch fresh in the background, swap when it lands; service worker caches shell + last data payload so a cold offline launch still shows yesterday's forecast.
- **Online-required** — error state when unreachable; nothing cached beyond the shell.
- Something in between, plus the refresh cadence (on-launch, periodic background, pull-to-refresh gesture?).

Also settle how the "last updated" / staleness is surfaced in the UI, and what the Mind One's freezer/power management (see `docs/notifications.md`) lets a background refresh actually do — a PWA gets no scheduler, so background refresh may be a fiction unless a launched-tab Web Worker keeps it alive.

This is a human call about how much offline resilience the MVP needs.

## Resolution

<!-- filled on close -->