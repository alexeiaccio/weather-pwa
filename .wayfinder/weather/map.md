# Weather · iOS 27 Clone on the Mind One — Wayfinder Map

> Map issue · local markdown tracker · label: `wayfinder:map`
> Tracking conventions: see `README.md` in this tracker. Tickets live in `tickets/`.

## Destination

A decision-pack + build recipe documented in this repo for **`weather.accio.blue`**: an installable PWA in the **iOS 27 Weather visual language** (typography, gradient sky, card layout — *not* pixel-cloning) showing **current conditions + hourly temperature graph + 10-day forecast** from real live weather data, tuned for the **iKKO Mind One** (1080×1240, density 400) and a **macOS browser window**. Stack mirrors the Spectre app (Vite + SolidJS 2 + Tailwind 4 + Effect + vite-plugin-pwa, deployed via a Wrangler Worker serving `dist/` on a custom domain in the `accio.blue` zone). The map ends when the build is unambiguous; writing the actual app is a downstream effort.

## Notes

- Domain: weather data APIs, iOS HIG / visual design, SVG data-viz (hourly curve), PWA install + service-worker caching, small-screen + desktop-window responsive layout.
- This tracker lives in the **weather-pwa repo** (`~/github/weather-pwa/.wayfinder/`), moved here 2026-08-19 from the ikko device-KB repo. Device facts/ADB flows for the Mind One target: `~/github/ikko/AGENTS.md` + `docs/`. Spectre stack reference: `~/github/spectre-pwa`.
- Skills sessions should consult: `wayfinder`, `grilling`/`grill-with-docs`, `domain-modeling`, `prototype`, `research`, `code-review`, `vite`/Solid 2 gotchas (see `~/github/spectre-pwa`).
- Deliberate stack (mirrors spectre-pwa): Vite + SolidJS **2** + Tailwind **v4** + TypeScript + Effect TS, `vite-plugin-pwa`, Wrangler deploy → `weather.accio.blue` custom domain on the existing `accio.blue` Cloudflare zone.
- Design decisions already made with the human (2026-08-19):
  - Destination: a **live, installable PWA on the Mind One** wearing the iOS 27 *visual language* — not a pixel clone.
  - MVP cut: **current conditions + hourly graph + 10-day forecast + real local weather data**. Radar/precipitation map and saved-city search/place list are **stretch goals**.
  - Hosting: **`weather.accio.blue`**. Stack: **same as the Spectre app**.
  - Audience: **iKKO Mind One first**, macOS browser near-second — layout must read on both.
  - Location source: **geolocation-first, pin wins after first run** (ticket W3).
- ATProto ideas are a separate effort, not this map.

## Decisions so far

<!-- one line per closed ticket -->

- [W1 · Weather data source and client contract](tickets/W1-weather-data-source.md) — **Open-Meteo** (api.open-meteo.com + geocoding API): browser-only fetch, **no key, no sign-up, official CORS, CC BY 4.0**; one plain-GET covers current + 7-day hourly (`precipitation_probability`) + 10-day daily. 10k calls/day free. **No alerts endpoint** (use NWS/MeteoAlarm later); Apple WeatherKit rejected — needs a paid ADP membership + server-side JWT token service (violates no-backend). Full contract + trimmed payloads: `.wayfinder/weather/research/W1-weather-data-source.md`.
- [W2 · iOS 27 Weather visual language and hourly-graph technique](tickets/W2-ios27-visual-language.md) — Visual language **unchanged since iOS 16, Liquid Glass polish in iOS 26**; iOS 27 (out Sept 2026) is **layout-only** (Highlights card, toggles) → build from stable iOS 26 look. Hero temp ≈100–120 pt **weight 100–300 thin-and-huge**, condition line weight 300, white SF Pro on condition×day/night sky; Liquid Glass cards ≈24–28 px radius translucent (`backdrop-filter`). **No circular UV gauge** — Wind/Pressure are the dials; precip band is blue. Hourly curve = **hand-rolled SVG**: Catmull-Rom→Bézier temp `<path>` + tapered blue precip band + Pointer-Event scrub. Full tokens/layout/sources: `.wayfinder/weather/research/W2-ios27-visual-language.md`.
- [W3 · Location source and place strategy](tickets/W3-location-source.md) — **Geolocation-first bootstrap, pin wins after first run, no hardcoded default.** First launch prompts for device location; once the user pins a **Place** via search it plays on launch (no re-prompts). GPS position shows a generic **"Current location" chip** (Open-Meteo is forward-only; a real name would cost a second provider). If geolocation is denied and no pin exists → search box empty state, no fallback city. Single pin in IndexedDB; saved-city list stays a stretch goal. Glossary: `CONTEXT.md`.
- [W5 · Main-screen visual prototype](tickets/W5-main-screen-prototype.md) — Verdict: **A · Glass faithful wins** — the researched iOS 26 visual language (+ iOS 27 layout additions) reads as the iOS Weather app; **single centered column** for both Mind One and macOS. Prototype: `.wayfinder/weather/prototypes/main-screen.html` (live Open-Meteo data; 3 variants tested — A glass faithful / B split desktop / C graph-first; B and C rejected for the MVP screen). Micro-calls (scrub vs scroll, glass density, banner/card cut) handed to W4.
- [W6 · Offline and refresh strategy](tickets/W6-offline-refresh-strategy.md) — **Online-first stale-while-revalidate** (SW caches shell + last payload; cold offline launch shows last-known forecast). Refresh: on-launch + pull-to-refresh + ~30-min visible-tab timer; **no background refresh** (PWA has no scheduler; Mind One freezer kills background work). UI: "Updated … ago" caption + explicit offline badge when serving stale. Caching implementation graduates into the data-layer ticket.

## Not yet specified

- Data-layer architecture mapped onto Solid + Effect (module shape, caching shape, refresh cadence) — sharpens now that W1 fixed the Open-Meteo contract, W3 the place store, and W6 the refresh policy. The place-store slice (single-pin IndexedDB, geolocation bootstrap, search-to-pin flow, search empty state) and the caching/refresh slice (SW routes, IndexedDB TTLs, fetch module, Mind One standby/freezer edge cases like `max_cached_processes`) each graduate into their own ticket once W4 lands.
- Sky/background gradient animation ambition (static in the W5 prototype) — re-grill after the MVP cut is set in W4.
- Stretch goals (RainViewer radar map, saved-city search, alerts via NWS/MeteoAlarm): whether/how they appear — re-grill after the MVP cut is set in W4.

## Out of scope

- macOS wide-window **split/two-column layout** — tested as prototype variant B and rejected on 2026-08-19; v1 uses the single centered column (W5). The iOS-style places **sidebar** returns only together with the saved-city list, a stretch goal.
- Widgets / lock-screen complications and weather push notifications (PWA-impossible, or microG-FCM-fragile on the Mind One; in-app severe-weather banners stay in scope, push does not).
- Play Store / native distribution.
- Pixel-level cloning of the iOS app.
- Any backend beyond the static Wrangler Worker — data is fetched client-side in v1.