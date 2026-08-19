---
id: W4
title: Screen content cut for the MVP
type: grilling
status: closed
blocked_by: [W1, W5]
assigned: Alexei Accio
---

## Question

Given the W5 prototype and the data that W1 makes available, what exactly is in the MVP cut?

Every element on the current-conditions screen gets a keep / drop / stretch call against the data the chosen API actually supplies: the metric cards (feels-like, humidity, wind, UV, visibility, pressure, sunrise/sunset, high/low), the severe-weather banner, the hourly strip content, the 10-day row content (high/low ± precip probability). Also settle: does the screen *page/scroll* through the forecast sections (iOS-style collapse) or is it one static column, and does the hourly graph scrub or just scroll?

This ticket is the human's cut — the map's destination only commits to the narrow must-have set; this decides the exact perimeter.

## Resolution

**Chosen MVP perimeter: hero current conditions + scrubbing hourly curve + 10-day list + a Metric quartet (Feels Like, Wind, Humidity, Pressure); severe-weather banner out; one static column.** Grilled with the human on 2026-08-19.

- **Metric quartet** — Feels Like, Wind, Humidity, Pressure: the two instruments W2 flags as the real dials (Wind/Pressure) plus the two most-referenced numbers. UV, Visibility, Sunrise/Sunset, Air Quality and the rest of the iOS grid stay out of v1 — a ready-made post-v1 stretch list.
- **Severe-weather banner — out.** Open-Meteo has no alerts endpoint; live alerts need NWS/MeteoAlarm (regional + second provider). Stays a stretch goal.
- **Hourly UX — scrub the curve**, as validated in W5 variant A: pointer drag / Mac hover reads exact temps with a marker + readout chip. No scrolling strip, no strip-tap-to-expand.
- **Structure — single static column**: hero → hourly → 10-day, page scrolls vertically. No collapsible sections, no swipe paging in v1.
- **10-day rows** keep the W2 anatomy as prototyped: day name, condition glyph + precip % when nonzero, low/high straddling a color-encoded temperature-range bar on a consistent 10-day axis, dot at the current temp on Today.
- **Data layer** (fetch module, single-pin place store, SW caching, refresh cycle) graduates into its own ticket — the last open piece before the build recipe.