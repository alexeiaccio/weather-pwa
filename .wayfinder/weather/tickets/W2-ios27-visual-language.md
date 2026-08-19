---
id: W2
title: iOS 27 Weather visual language and hourly-graph technique
type: research
status: closed
blocked_by: []
assigned:
---

## Question

What exactly does the iOS 27 Weather app look like, and how does a PWA reproduce it with web tech?

Pin down, from high-trust sources (Apple marketing/App Store screenshots, WWDC 2026 material, SDK/HIG, credible reverse-engineering write-ups):

1. **Current-conditions screen anatomy** — typography scale (the giant temperature, the thin-light condition line), color palette, the animated sky/atmospheric gradient background and how it changes with conditions, the rounded card list, the circular UV gauge, the metric detail grid, the severe-weather banner treatment, subtle large-type animation on scroll.
2. **What iOS 27 changes vs. iOS 26** (new in this year's release — verify it's announced/available given the date).
3. **Hourly forecast strip** — the temperature *curve* rendered as a scrolling line/path, the blue precipitation band under it, interaction/scrub behavior. Recommend a web technique for the curve + band (SVG path vs. canvas) matching the data shape from W1.
4. **10-day forecast row anatomy** — the day column, condition glyph, precip probability, high/low columns.
5. **Wide-window variant** — how the iOS/iPadOS app lays out on a wide canvas (place list sidebar?) so the macOS target has a reference.

Deliverable: a design-token + layout reference the W5 prototype can build to, with sources cited.

## Resolution

iOS 27 (WWDC 2026-06-08; beta 6; releases Sept 2026) changes Weather layout only — **Highlights** card, **Conditions/Precipitation/Wind** home-page toggles, 10-day mode switching, extra-large widget — with **no visual-language change**; the stable iOS 26 Liquid Glass look (rounder translucent cards, white SF Pro text, animated 77-scene sky keyed by condition × day/night, giant thin temperature ≈100–120 pt, thin condition line) is the build target. Full tokens (SF/Inter stack, sky hexes, materials/spacing), screen anatomy, 10-day row and wide-window (sidebar-detail) references are in the report. **Recommended graph technique: hand-rolled SVG** — one smooth Catmull-Rom→Bézier temperature path + a per-hour tapered blue precipitation band (0–100% own y-scale) + Pointer-Event scrub with a precomputed x→y curve lookup and rAF-throttled marker; no canvas/uPlot at 24–240 points. Corrections: no circular UV gauge (UV = number + bar; Wind/Pressure are the dials); precipitation color is blue. Full report: `.wayfinder/weather/research/W2-ios27-visual-language.md`