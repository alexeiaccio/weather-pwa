# AGENTS.md — Weather PWA

## State of the project

**Planning phase.** The effort is charted as a wayfinder map at `.wayfinder/weather/map.md` — read it first; it is the canonical artifact for this project. Decision tickets live in `.wayfinder/weather/tickets/` (open, unblocked tickets = the frontier). Research findings live in `.wayfinder/weather/research/`.

## Context pointers

- **Stack reference (mirror this):** the Spectre PWA at `~/github/spectre-pwa` — Vite + SolidJS 2 + Tailwind 4 + TypeScript + Effect, `vite-plugin-pwa`, Wrangler Worker serving `dist/` to a custom domain on the `accio.blue` zone. Clone its `wrangler.toml` shape for this app.
- **Target device:** iKKO Mind One (Android 15, 1080×1240 @ density 400). Device facts, ADB-over-WiFi flows, and PWA/debug how-tos live in `~/github/ikko/` (AGENTS.md + `docs/`). The phone is the launch target for the PWA.
- **Second target:** a macOS browser window (Safari/Chrome).

## Wayfinder ops

Tracker conventions: `.wayfinder/README.md`. Claim a ticket by setting its `assigned` frontmatter before working it; resolve by appending `## Resolution`, setting `status: closed`, and adding a one-line decision to the map's _Decisions so far_.

## Rules

- Follow the global agent rules in `~/.config/opencode/AGENTS.md` (no `nohup`, etc.).
- Planning by default: resolve decision tickets, don't build the app unless a ticket or the destination explicitly calls for it.
