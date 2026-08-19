---
id: W3
title: Location source and place strategy
type: grilling
status: open
blocked_by: []
assigned:
---

## Question

Where does the app get the place it shows weather for?

Options being weighed:

- **Device geolocation** — Geolocation API permission prompt on first launch; works on the Mind One (needs location on) and macOS Safari/Chrome. Zero UI, but a bare prompt, no saved places.
- **Pinned place from search** — a small geocoding/search box, chosen place saved (localStorage/IndexedDB); no geolocation need at all, works fully offline-first.
- **Hardcoded default city** — a fixed lat/lon baked at first run; simplest possible, no UI.

Also decide: geolocation failure/denial fallback, and whether a reverse-geocoded place *name* must show in the header (needs a geocoding call).

This is a human call — the user may also opt into the saved-city-list stretch goal here, or keep it out of MVP.

## Resolution

<!-- filled on close -->