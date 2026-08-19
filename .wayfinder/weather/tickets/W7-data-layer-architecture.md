---
id: W7
title: Data-layer architecture on Solid + Effect
type: grilling
status: closed
blocked_by: [W1, W3, W6]
assigned: Alexei Accio
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

**Chosen: mirror the Spectre shape — Effect services own all data behind a Context.Service facade with typed Schema decoding; Solid consumes via thin `use-*` hooks + resources; no query lib; cached payloads live in app-owned IndexedDB, the SW precaches only the shell; metric units only in v1.** Grilled with the human on 2026-08-19; stack reference = `~/github/spectre-pwa`.

Architectural sketch (dependency diagram, documented — not built):

```
UI (Solid 2) ────────────────────────────────┐
  MainScreen → use-weather(place) hook        │
  · createResource(() => effect.runPromise(   │  Solid signals + resources only
  ·   WeatherService.fetchForecast(...) ))    │  no query/state lib
───────────────────▼──────────────────────────┘
Data layer (Effect 4, Context.Service) ───────┐
  WeatherService  f/fetchForecast(lat,lon)     │ one Open-Meteo GET  (W1)
                  Effect.Schema decode         │ ttl: current 10min, hourly 1h, daily 6h
                  Effect.timeout + abort       │ typed TaggedError union
  PlaceStore      g/get() s/set(place)         │ 1 row, IndexedDB table `places`
                  geolocation bootstrap rule   │ W3: no pin + denied → search empty state
  WeatherStore    r/read(key) w/write(key)     │ IndexedDB table `forecast_cache`
                  SWR swap + `updatedAt`       │ key = rounded lat/lon + date + unit-locale
───────────────────▲──────────────────────────┘
Persistence ───────────────────────────────────┐
  @effect/platform-browser IndexedDbDatabase   │ mirrored from Spectre storage.ts
  Migration-chain per table; upsert/query      │
───────────────────────────────────────────────┘
Service worker / deploy ──────────────────────┐
  vite-plugin-pwa registerType: 'prompt'      │ precache shell (js/css/html/icons) only
  navigateFallback: /index.html               │ payload lives in IndexedDB (W6 intent),
  Wrangler Worker: ASSETS static passthrough  │   no SW/API-cache duplication
  custom domain weather.accio.blue            │ cold offline launch reads IndexedDB
───────────────────────────────────────────────┘
```

Concrete module boundaries (mirroring Spectre naming):

- `src/lib/weather/api.ts` — `WeatherService` (`Context.Service<'WeatherService'>` + `Effect.fn('fetchForecast')`): URL builder (current + hourly + daily in one GET, `timezone=auto`, celsius/kmh/mm units), `Effect.Schema` decode of the Open-Meteo payload, `Effect.timeout(10s)` + AbortController, `WeatherError` TaggedError union (Timeout | Network | Schema | Http) mapped to domain errors.
- `src/lib/place/store.ts` — `PlaceStore`: IndexedDB table `places` (single-row by fixed key `pinned`), write-through on pin, read at launch; bootstrap resolver: geolocation → pin → search empty state (W3).
- `src/lib/weather/store.ts` — `WeatherStore`: IndexedDB table `forecast_cache` keyed by `(roundedLat, roundedLon, yyyy-mm-dd, unitLocale)`; rows carry `{ payload, fetchedAt, expiresAt }`; TTLs 10min/1h/6h (W1); SWR loop swaps stale rows when fresh fetch lands; `updatedAt` feeds the "Updated … ago" caption + offline badge (W6); on place change the old cache stays keyed and is never deleted (free to revisit later) but the UI reads only the active key.
- `src/use-weather.ts` (+ sibling hooks) — thin Solid hooks wrapping Effect via a singleton `ManagedRuntime` (`Effect.runPromise` from resources), exposing `{ data, loading, stale, offline, refresh, error }`.
- `src/lib/pwa.ts` — `registerSW` from `virtual:pwa-register` with `registerType: 'prompt'`; "Update available" prompt → `updateSW(true)` on confirm; app-version stamp (git short hash + build time) surfaced in the footer (Spectre `version.ts` pattern).
- `wrangler.toml` — mirror Spectre: `assets = { directory: "./dist", binding: "ASSETS", not_found_handling = "single-page-application" }`, custom-domain route `weather.accio.blue`, `workers_dev = true`.

Glossary: no new terms; the layer names above use the existing CONTEXT.md vocabulary (Place, Current location, Pin, Stale data, Refresh). The map is now unambiguous for the builder — dependency sketch above + this ticket's link is the build recipe's blueprint.