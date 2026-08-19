---
id: W5
title: Main-screen visual prototype
type: prototype
status: closed
blocked_by: [W2]
assigned: Alexei Accio
---

## Question

Does the researched iOS 27 visual language, applied to realistic weather data in a static screen, read as "the iOS 27 Weather app" on the Mind One (1080×1240, density 400) and in a macOS browser?

Build a throwaway static prototype (in the repo's timeline: Solid+Tailwind+Effect to match the stack, or a plain HTML/CSS spike if that's faster to react to) of the current-conditions screen + hourly graph + 10-day list, using the W2 design reference and realistic data shaped like W1's chosen API (live fetch if a keyless provider is already decided, else a small sample fixture). Two viewport targets: the Mind One portrait dimensions and a macOS desktop window.

The human reacts on the device (via the ADB flows in this repo) and in the browser; the reaction settles the visual language bar and feeds W4's content cut.

Links the prototype as an asset in the resolution.

## Resolution

**Verdict: variant A (Glass faithful) wins — the researched iOS 26 visual language + iOS 27 layout additions read as the iOS Weather app; a single centered column on both Mind One and macOS.** Human pick on 2026-08-19.

- **Prototype:** `.wayfinder/weather/prototypes/main-screen.html` — throwaway static spike (plain HTML/CSS/SVG, no framework). Run: `python3 -m http.server 8137` from `.wayfinder/weather/prototypes/`, open `main-screen.html?variant=A`. Live Open-Meteo fetch (Moscow point, keyless per W1) with an embedded fixture fallback.
- **Three structural variants tested** via `?variant=` / the bottom pill: **A · Glass faithful** (hero-first vertical stack, W2 tokens as researched), **B · Split desktop** (hourly + 10-day side-by-side on ≥768px), **C · Graph-first** (hourly curve as the hero). All three rendered clean; the human picked **A**; B and C were rejected for the MVP screen.
- **Validated from the research:** thin-huge hero temp (weight 200, `clamp(96px,28vw,220px)`), glass cards (26px radius + `backdrop-filter: blur(22px)`), steel-blue day sky, hand-rolled SVG hourly curve (Catmull-Rom → Bézier, gradient fill) with a tapered blue precipitation band and pointer scrub — all read as iOS Weather.
- **Data contract shaped the screen directly:** hourly/daily arrays map straight onto W1's Open-Meteo payloads; the header shows the W3 **"Current location" chip**. Footnote shows "Updated just now" + Open-Meteo attribution (W1 CC BY 4.0).
- **Handed to W4 (content cut):** the micro-decisions the prototype surfaced stay open — hourly curve scrubs vs scrolls, glass density on the small screen, whether metric cards / severe banner join the perimeter.