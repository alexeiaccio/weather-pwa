# Weather PWA

An installable PWA in the **iOS 27 Weather visual language**, for the iKKO Mind One and macOS browsers, deployed at **`weather.accio.blue`**.

Current state: **planning** — the effort is charted as a wayfinder map in `.wayfinder/weather/map.md`. The trajectory is a decision-pack + build recipe; the app itself is a downstream effort.

- Stack: mirrors the Spectre app — Vite + SolidJS 2 + Tailwind 4 + TypeScript + Effect, `vite-plugin-pwa`, Wrangler deploy (static assets) to a custom domain on the `accio.blue` Cloudflare zone.
- Data: Open-Meteo (decided, see `.wayfinder/weather/tickets/W1-weather-data-source.md`).
- Upstream reference: `~/github/spectre-pwa` (same stack, working PWA) and `~/github/ikko` (Mind One device KB + ADB flows).

## Getting started (scratchpad — no app yet)

Nothing to run yet. This repo currently holds the wayfinder tracker only.