---
id: W7
title: Data-layer architecture on Solid + Effect
type: grilling
status: open
blocked_by: [W1, W3, W6]
assigned:
---

## Question

How is the data layer shaped in the actual app? Everything the API, place, and refresh decisions fixed is now known (W1 contract, W3 place store, W6 refresh + cache policy, W4 screen cut) — only the Solid + Effect module shape is left:

- **Fetch module** — the Open-Meteo client: URL building (current + hourly + daily in one GET per W1), typed response decoding (Effect Schema), error/timeout handling, abort, unit params.
- **Place store** — the single-pin IndexedDB store from W3: write-through on pin, read-at-launch, geolocation bootstrap resolution ("no pin + denied → search empty state"), place object shape (id, name, lat, lon, admin1, country, timezone).
- **Weather store** — cached payloads keyed by place+date (per W6): TTLs (≈10 min current / ≈1 h hourly / ≈6 h daily from W1), stale-while-revalidate swap policy, "Updated … ago" timestamp source.
- **Query layer** — how Solid components consume it (Effect + @solid-primitives or Signals + resources; suspense/loading states on the Mind One and macOS).
- **Service worker** — what Wrangler/vite-plugin-pwa precaches (shell + last data payload per W6), cache names/versioning, fetch handlers.

Decide the module boundaries, the Effect-vs-Solid ownership split, and the cache/refresh loop shape. This is the last decision before the build recipe — it can be materialized as a dependency sketch/arch diagram (documented, not built) in the resolution.

## Resolution

<!-- filled on close -->