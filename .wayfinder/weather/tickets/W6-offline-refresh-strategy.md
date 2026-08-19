---
id: W6
title: Offline and refresh strategy
type: grilling
status: closed
blocked_by: []
assigned: Alexei Accio
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

**Chosen: online-first **stale-while-revalidate** with a stale chip; **launched-tab-only** refresh; **"Updated…" caption + offline badge**.** Grilled with the human on 2026-08-19.

- **Offline:** service worker caches the shell + last data payload; a cold offline launch still shows the last-known forecast instantly, then a background fetch swaps in fresh data when connectivity returns. Data payload cached in IndexedDB keyed by place + date (per W1 caching notes).
- **Refresh cadence:** on launch, plus pull-to-refresh, plus a ~30-min auto-refetch *only while the tab is open and visible*. No background-refresh ambition — a PWA has no scheduler on Android and the Mind One's freezer kills background work.
- **Staleness UI:** a small caption under the header — "Updated just now" / "Updated 14 min ago" — plus an explicit **offline badge** when serving cached data without connectivity.
- **Rejected:** online-required (dead screen in the subway with no recourse), silent SWR (yesterday's weather with no explanation), kept-alive Web Worker (a fiction on this device — the freezer kills it and the tab must stay open anyway).
- **Implementation shape** (service-worker routes, IndexedDB TTLs, module boundaries for the fetch/refresh cycle) graduates into the data-layer architecture ticket once W4 lands.