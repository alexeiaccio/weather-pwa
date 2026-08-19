---
id: W3
title: Location source and place strategy
type: grilling
status: open
blocked_by: []
assigned: Aleksey Tukachev
status: closed
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

**Chosen: geolocation-first with search-to-pin override; no hardcoded default city; saved-city list stays a stretch goal.** Grilled with the human on 2026-08-19:

- **Primary source:** Geolocation API on first run (permission prompt) → weather for the device's live position.
- **Pin wins after first run:** once the user pins a Place via search, that Place plays on launch; no further permission prompts. Geolocation is a bootstrap, not a per-launch behavior. (Rejecting "geolocate every launch": the pin would feel ignored, plus more GPS churn on the Mind One.)
- **Header naming:** a GPS-derived position shows a generic **"Current location" chip** — Open-Meteo geocoding is forward-only, so a real name would cost a second provider (Nominatim/BigDataCloud). Pinned Places show their real geocoded name. Reverse geocoding can be added later without structural change.
- **Cold-start fallback:** **none hardcoded** — if geolocation is denied/unavailable and no pin exists, show the search box with a gentle empty state.
- **Storage:** the single pin persisted in IndexedDB; the stored Place object carries name + coords + `timezone`.
- **Saved-city list** (search + multiple saved places): **remains a stretch goal**, out of MVP.

Domain terms sharpened in this session → `CONTEXT.md` (Place vs Current location vs Pin vs search empty state).