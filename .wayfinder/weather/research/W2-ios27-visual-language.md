# W2 · iOS 27 Weather — Visual Language & Hourly-Graph Technique

> Research ticket W2 for the `weather.accio.blue` PWA (iOS-27-visual-language clone on a 1080×1240 / density-400 Mind One panel + macOS browsers). Goal: a decision-dense token + layout reference a frontend prototype can build to. Verified against high-trust sources as of **2026-08-19**. Where Apple publishes no value, we say so and give a labeled approximation. Every claim is cited to its owning source in [Sources](#sources).

## Status headline (read this first)

- **iOS 27 is NOT released yet** (as of 2026-08-19). Announced at WWDC 2026 (**June 8, 2026**); developer betas since June, public beta since July, final release expected **September 2026** (beta 6 ≈ Aug 17, 2026). Everything below that is "new in iOS 27" is verified from beta coverage, and the visual language itself is unchanged from iOS 26 — the iOS 27 changes are **layout/views, not colors/typography/cards** ([S2](#s2), [S3](#s3), [S4](#s4), [S11](#s11)).
- The **visual language** (giant thin temperature, animated sky, rounded cards, metric grid) has been stable since the **iOS 16 redesign (2022)**, with **Liquid Glass polish in iOS 26 (Sept 2025)**: rounder corners, more translucency, more spacing ([S5](#s5), [S6](#s6), [S7](#s7)). Build the clone from the stable iOS 26 visual language + the iOS 27 layout additions.
- One correction to the ticket's assumptions: there is **no circular UV gauge** in Apple Weather. UV Index is a number + colored bar/chart. The circular/radial gauges in the app are **Wind (compass)** and **Pressure (radial dial)**; Sunrise/Sunset uses a sky-arc diagram ([S18](#s18), [S19](#s19)).

---

## Design tokens

### Typography scale

Font family: **SF Pro** (iOS/macOS system font; SF Pro Display optical size above 20 pt) ([S8](#s8)). Apple publishes no per-label Weather font spec — sizes below are labeled approximations consistent with screenshots and HIG scales; a PWA renders them with `-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, system-ui`.

| Element | Weight | Size (design pt ≈ dp) | CSS equivalent (Mind One @ density 400 ⇒ 1 dp ≈ 2.5 CSS px; clamp by width) | Notes |
|---|---|---|---|---|
| **Hero current temperature** | **Ultralight / Light (100–300)** | ≈ 100–120 pt on iPhone portrait | `clamp(96px, 28vw, 220px)`, weight 100–300, `letter-spacing: -0.02em`, `line-height: 1` | Single most important pixel; must read as thin-and-huge, not bold. Largest element in the hierarchy ([S9](#s9), [S10](#s10)). |
| City / location name | Semibold (600) | ≈ 28 pt (HIG `.largeTitle` = 34 pt) | 28–34 px, weight 600 | Secondary position *above* the temperature ([S9](#s9)). |
| **Condition line** (e.g. "Partly Cloudy") | **Thin / Light (200–300)** | ≈ 28–34 pt | 28–34 px, weight 300 | Thin-light line directly under the hero temp, same baseline alignment as H/L ([S9](#s9), [S10](#s10)). |
| High/Low ("H:73° L:52°") | Regular (400) | ≈ 20 pt | 20–22 px, weight 400 | Tertiary tier, sits on the condition line ([S9](#s9)). |
| Card section titles | Regular (400) | ≈ 15 pt (HIG `.subheadline`) | 15 px | e.g. "HOURLY FORECAST", "10-DAY FORECAST" ([S19](#s19)). |
| Card values | Medium (500) / Regular | 17–20 pt | 17–20 px | Metric cards ([S6](#s6)). |
| Footers / captions | Regular | 11–13 pt (HIG `.caption`) | 11–13 px | Min legible size = 11 pt per HIG ([S8](#s8)). |

Hierarchy rule (verified from a comparative analysis of the three-tap structure): **temperature is the primary info and renders largest; city name is secondary and sits above it; condition text + min/max are tertiary** ([S9](#s9)). SF Symbols glyphs render in the same weight as adjacent text ([S8](#s8)).

Tracking per HIG: at display sizes ≥ 20 pt SF Pro tightens tracking (e.g. 22 pt = −12/1000 em, 72 pt = +2, ≥ 96 pt = 0) ([S8](#s8)). In practice the hero uses small negative tracking.

### Colors

Apple **does not publish hex values** for the Weather sky. What is verified from the actual app bundle (537 `.caml` scene files reverse-engineered from the Weather app's `Mica/` directory) ([S12](#s12)):

- **77 scenes** = **42 conditions × day/night**, plus time-independent `clear`, `hot`, `mostlySunny`, `rainbow` ([S12](#s12), [S13](#s13)). The scene list (authoritative condition vocabulary for the clone): blizzard, blowingSnow, breezy, cloudy, drizzle, dust, flurries, fog, frigid, hail, haze, heavyRain, heavySnow, hurricane, isolatedThundershowers, isolatedThunderstorms, mixedRainAndSleet, mixedRainAndSnow, mixedRainfall, mixedSnowAndSleet, mostlyCloudy, mostlySunny, partlyCloudy, rain, scatteredShowers, scatteredSnowShowers, scatteredThunderstorms, severeThunderstorm, showers, sleet, smoke, snowShowers, snow, thunderstorm, tornado, tropicalStorm, windy, sunny + clear/hot/rainbow ([S13](#s13)).
- The sky is a **dynamically computed gradient** in the newer iOS 15+ VFX system (`gradientTop`, `sunAngle`, five cloud layers, 610-entity scene graph), keyed by **sun angle + condition + latitude** — i.e. it changes by **time of day and condition**, interpolating dawn → day → dusk → night ([S12](#s12), [S7](#s7)). The older Mica scenes carry **no gradient layers at all**; thunderstorm-family scenes ship a **flat sky color** on an underlying layer ([S12](#s12)).
- Fallback backdrop hexes derived from the scene corpus (approximation, day/night split) ([S12](#s12)):
  - Day conditions: `#4a7ba8` (steel blue) · Night conditions: `#101d2e` (near-black navy) · dawn/dusk/other: `#2d5580`.
- Text on sky is **white**, with legibility maintained via translucent materials (see spacing/cards below) ([S9](#s9), [S21](#s21)).

Recommended token model for the PWA (verified structure + our values, approximation flagged):

```
--sky-day:      #4a7ba8   (base; overlay a subtle vertical gradient, lighter at horizon)
--sky-night:    #101d2e
--sky-dusk:     #2d5580
--ink:          #ffffff        (all text)
--text-secondary: rgba(255,255,255,0.75)
--accent-blue:  #59a9ff        (semantic: precipitation / links)
--accent-amber: #ffb340        (semantic: UV / heat)
--card-fill:    rgba(255,255,255,0.12)   (glass card)
--card-fill-strong: rgba(255,255,255,0.18)
--alert-red:    #ff3b30        (severe weather)
```

Condition → sky family (design mapping, from scene structure + screenshots): clear = saturated blue day / navy night; partly/mostly cloudy = steel blue → gray-blue; rain/showers = gray-blue with darker base; thunderstorm = dark flat storm color (scene `backgroundColor`); snow = pale slate; fog/haze = muted gray; hot = warmer/amber-tinted. Implement as one `SceneSpec(condition, timeOfDay)` that picks a 2–3 stop vertical gradient + particle layer ([S7](#s7), [S12](#s12), [S21](#s21)). The background is the *weather report* before any number is read — condition + time of day must read at a glance ([S10](#s10)).

Semantic data colors (precipitation = blue, heat = red-orange, overcast = gray) are the established vocabulary ([S10](#s10)).

### Spacing / cards / materials

- Card-based interface since iOS 15; each metric is a **rounded card**, rounded-corner radius pushed up by Liquid Glass in iOS 26 ("almost everything is rounder and more spacious") ([S6](#s6), [S19](#s19), [S14](#s14)).
- Token set: **8-pt grid**, card radius ≈ **24–28 px** (iOS 26 vibe), inner padding ≈ 16–20 px, gap ≈ 12–16 px, cards separated into distinct visual units ([S14](#s14), [S9](#s9)).
- Materials: Apple Weather layers the UI over the sky with **`.thinMaterial` on the hourly strip, `.regularMaterial` on daily cards, `.thickMaterial` on alert banners** — translucent, vibrancy-rendered text ([S21](#s21)). Web equivalent: `backdrop-filter: blur(12–24px)` + rgba fills above.
- Touch targets ≥ 44 dp; min legible text 11 pt ([S21](#s21)).

---

## Screen anatomy (current conditions)

Verified stacking order, top → bottom (iPhone portrait; from Apple Support "Check the weather on iPhone", iOS 26 version) ([S15](#s15), [S16](#s16), [S17](#s17), [S19](#s19)):

1. **Fixed full-screen animated sky backdrop** — condition + time-of-day scene, stays fixed while content scrolls over it; "temperature-as-backdrop" effect = the giant temperature floats over the sky while cards scroll beneath ([S17](#s17), [S12](#s12), [S7](#s7)).
2. **Header**: city name (semibold) → **giant thin temperature** → **thin condition line** ("Partly Cloudy") with H/L on the same line ([S9](#s9), [S16](#s16)).
3. **Severe-weather banner** (only when active): appears **directly under the temperature, just above the hourly forecast**; warning-icon card; red treatment, `.thickMaterial`; in critical conditions a special panel appears at the top of the grid on Mac ([S16](#s16), [S18](#s18), [S20](#s20)).
4. **Highlights section (NEW in iOS 27)**: expanded need-to-know summary card near the top — temperature swing, rising rain chance, high winds for the next day or so; sits where the old one-line summary was ([S3](#s3), [S4](#s4), [S2](#s2)).
5. **Forecast view toggles (NEW in iOS 27)**: three icons above the hourly forecast — **Conditions** (cloud+sun), **Precipitation** (droplet), **Wind**; tapping swaps the hourly row *and* the 10-day list into that mode ([S3](#s3), [S4](#s4), [S11](#s11)).
6. **Hourly forecast card** — horizontal scrollable strip: hour (current = "Now"), condition glyph, temperature; swipe left/right; sunrise/sunset appear at day boundaries; current hour visually emphasized ([S15](#s15), [S17](#s17), [S19](#s19)).
7. **10-day forecast card** — 10 rows; anatomy in its own section below ([S17](#s17), [S15](#s15)).
8. **Metric detail grid** — cards in this order: Air Quality (with a scale that can appear *above* the hourly row), temperature map, **UV Index** (number + peak-of-day + colored gauge bar — **not circular**; "See the UV estimates throughout the day" via tap-through chart), **Sunrise/Sunset** (sky-arc diagram), **Wind** (compass dial, direction + speed + gusts), **Precipitation**, **Feels Like**, **Humidity** (+ dew point), **Visibility**, **Pressure** ([S17](#s17), [S15](#s15), [S6](#s6), [S18](#s18), [S19](#s19)).
9. **Tap-through detail views**: tapping any card (or the hourly strip / a 10-day day) opens a full **24-hour graph** for that metric with a parameter switcher (Conditions / UV Index / Wind / Precipitation / Feels Like / Humidity / Visibility / Pressure), a date picker across ±10 days, and **press-and-drag scrubbing** to read exact values ([S6](#s6), [S17](#s17), [S22](#s22), [S23](#s23)).
10. **Dynamic layout rule** (iOS 15+): when rain is present/coming, precipitation content (next-hour chart, radar) floats *up* toward the top; when dry, the app emphasizes current conditions + 10-day and pushes maps down ([S24](#s24), [S17](#s17)).

---

## iOS 27 vs iOS 26 (dated)

| | **iOS 26** (released) | **iOS 27** (beta, unreleased) |
|---|---|---|
| Announcement | WWDC **June 9, 2025**; released **Sept 15, 2025** ([S5](#s5)) | WWDC **June 8, 2026**; betas Jun–Aug 2026; **release Sept 2026** ([S2](#s2), [S4](#s4), [S25](#s25)) |
| Design language | **Liquid Glass** system-wide: translucency, more-rounded corners, more spacing, floating pill UI, scroll-edge effects ([S5](#s5), [S6](#s6), [S7](#s7)) | Refinement; **no Weather visual-language change reported** — layout-only ([S1](#s1), [S2](#s2)) |
| Weather, new | Severe-weather alerts + Weather widget for **Significant Locations** (Smart Stack); satellite weather ([S26](#s26)) | **Highlights** summary card; **Conditions / Precipitation / Wind** home-page view toggles; 10-day rows + maps switch mode with the toggle; **extra-large full-page widget** ([S1](#s1), [S2](#s2), [S3](#s3), [S4](#s4)) |
| Forecast data | Apple Weather (Dark Sky engine) ([S27](#s27)) | **Unchanged** — same data, same accuracy; the iOS 27 changes are navigational ([S4](#s4), [S11](#s11)) |
| AI | — | **No AI features in Weather** per MacRumors; Highlights *may* be AI (Feedback icon in beta, unconfirmed by Apple) ([S1](#s1), [S3](#s3)) |

**Practical takeaway for the clone:** build the **iOS 26 visual language** (it is released, screenshottable, stable) and adopt the **iOS 27 layout additions** that survived to beta 6 (Highlights card + view toggles). Do not chase unreleased pixel changes — betas "subject to change before release" ([S11](#s11)).

---

## Hourly graph: anatomy + recommended web technique

### Anatomy (verified)

Two surfaces in the current app ([S15](#s15), [S17](#s17), [S22](#s22), [S23](#s23)):

1. **Main-screen hourly strip**: horizontal scroll of hour/icon/temp columns ("Now" first); tapping the card opens the detail view.
2. **Detail graph (24 h)**: a **smooth temperature curve** across the day with per-hour data points; under it, a **chance-of-precipitation graph**; **press-and-drag scrubs** the timeline — a marker follows the finger and the readout shows the exact value for that hour (temperature in Conditions mode, probability % in Precipitation mode) ([S17](#s17), [S22](#s22), [S23](#s23), [S15](#s15)). Hover-to-read on Mac, drag-on-touch on iOS ([S18](#s18)).
   - iOS 27 Precipitation mode renders the probability as **bars that "fill up" with the chance of rain** (walkthrough: "a bar graph that fills up if there's a chance of rain") ([S4](#s4), [S28](#s28)).
   - Apple's precipitation visuals are **blue** (maps, next-hour chart) ([S19](#s19), [S10](#s10)).

### Recommended web technique: **hand-rolled SVG** (no chart lib, no canvas)

Given the W1 data shape (Open-Meteo-style hourly arrays: `time[]`, `temperature_2m[]`, `precipitation_probability[]`, 24 h–7 d), the curve + band is ~24–240 points. Recommendation: **a single `<svg>` with a fixed viewBox, one smooth `<path>` for the temperature curve, one filled `<path>` for the gradient fill, one `<path>`-or-`<rect>` group for the blue precipitation band, and a pointer-driven scrub overlay.** (~200 lines, no dependency.)

Concrete recipe:

- **Coordinate mapping**: `x = i * slotW + slotW/2`, `y = mapY(temp)`. Slot width ≈ 40–48 px; curve viewport ≈ 120–160 px tall; precipitation band ≈ 40–60 px below it, baseline at fixed y. Domain = min/max of the visible temps, padded; the band maps 0–100% probability onto its own fixed height (same trick as the SVG weather-graph implementation: temp uses its own y-scale, precip maps 0–100% to full band height) ([S29](#s29)).
- **Curve smoothing**: build the path with **monotone-cubic (Catmull-Rom → cubic Bézier) interpolation** through the hourly points, not straight `lineTo` segments — Apple's line reads as one continuous rounded curve. Use `stroke-width ≈ 2–3`, `stroke-linecap/linejoin: round`, `vector-effect="non-scaling-stroke"` so it stays crisp when the SVG scales ([S29](#s29), [S30](#s30)).
- **Gradient fill (optional, hero look)**: close the curve path to the band baseline and fill with a vertical `linearGradient` white→transparent; Apple's Conditions detail keeps a light fill under the line, the hourly strip column reads cleaner without one — decide in prototype ([S30](#s30), [S29](#s29)).
- **Precipitation band**: draw **one block per hour as a 4-point path** (`M x0 top L x0 y0 L x1 y1 L x1 top Z`) so the top edge tapers between consecutive hours — this is exactly how the reference SVG implementation renders the band; blue at ~25–35% opacity, scaled with probability ([S29](#s29)). For the iOS 27 bar look, discrete rounded `<rect>`s at probability height also work — pick bars if you clone iOS 27's Precipitation mode, tapered band if you clone the Conditions-detail look.
- **Scrub interaction**: Pointer Events on the wrapper (`pointerdown`/`pointermove`/`pointerup` + `setPointerCapture`) unify touch and mouse. Map `clientX → hour index`, snap to nearest slot, and render: a vertical hairline, a highlighted dot on the curve (y interpolated along the smoothed path — precompute an x→y lookup for instant tracking, the exact technique used in the iOS graphing engine write-up ([S30](#s30))), and a readout chip (hour + temp / precip %) pinned above the line. Throttle with `requestAnimationFrame`. On desktop, `hover` shows the marker, drag-or-click scrubs ([S18](#s18), [S30](#s30)).
- **Scrolling**: wrap the SVG in `overflow-x: auto` for a fixed-height curve that scrolls (Apple scrolls the graph horizontally through the day), or `viewBox`-fit a window of ~8 h. Keep the strip's own horizontal scroll independent of the vertical page scroll.

**Why not canvas / a lib:** at 24–240 points SVG DOM cost is trivial and Canvas buys nothing except manual hit-testing, DPR handling and redraw logic. uPlot (canvas) is built for dense time-series + its own axes/legend/zoom machinery; our chart is bespoke (transparent, curved, band-under-curve, must blend into a gradient card) so a lib's styling surface is a fight. Hand-rolled SVG keeps the design exact, is trivially themable from the tokens above, and matches the two reference implementations' approach ([S29](#s29), [S30](#s30)). Revisit canvas **only if** the radar-map stretch goal lands (pixel-scale animated overlays).

---

## 10-day rows

Verified anatomy, top → bottom within each row ([S15](#s15), [S19](#s19), [S17](#s17), [S6](#s6)):

1. **Day column** (left): "Today" then weekday names; left-aligned.
2. **Condition glyph**: SF Symbol outline style, white; **chance-of-precipitation %** printed next to it when nonzero ("chance of precipitation" is a listed 10-day column) ([S15](#s15), [S19](#s19)).
3. **Low temp** (left of the bar), **High temp** (right of the bar).
4. **Temperature-range bar** between low/high: the bar **spans the full 10-day min→max range for every row** (consistent axis across all days); each day's **colored segment** covers that day's range; **color encodes temperature** (dark blue → light blue → green → red as it warms); **a dot marks the current temperature** on Today's row ([S19](#s19), [S17](#s17), [S6](#s6)).
5. Row alignment: label column ~ fixed left, icon column, then low → bar → high all right-aligned into a temperature "lane" ([S19](#s19)).
6. iOS 17 rename: the 10-day "Temperature" detail became "Conditions" and now also carries a chance-of-precipitation graph + a daily comparison vs yesterday for Today; both roll up into the iOS 27 mode toggles ([S22](#s22), [S4](#s4)).

---

## Wide window

Verified layouts for wide canvases:

- **iPad** (iPadOS 16+): single main detail column + a **toggleable locations sidebar** (top-left button). Sidebar = search field at top + saved-locations list ("My Location" first), rearrange by drag, delete by swipe. Same card stack as iPhone, just wider ([S31](#s31), [S15](#s15)). The Weather app does **not** use two side-by-side dashboards on iPad.
- **macOS** (Ventura 13+, still the model for macOS 26): **sidebar-detail split**. Left = locations list ("My Location" dynamic entry) + search; right = header (current temp, condition summary, high/low) over the **animated weather background**, then a **grid of info panels** (Conditions, 10-Day, AQ, UV, Sunrise/Sunset, Wind, Precipitation, Feels Like, Humidity, Visibility, Pressure). Grid is **not rearrangeable**; in critical conditions a **warning panel is added at the top**. Sidebar toggleable; charts respond to **pointer hover** ([S18](#s18), [S20](#s20), [S32](#s32)).

**Recommendation for `weather.accio.blue`:** single centered column `max-width ≈ 420–480 px` for both Mind One and macOS (matches iPhone anatomy and reads clean at macOS-window widths); reserve the locations **sidebar** for the stretch goal (map says saved-city search is stretch). If a sidebar lands, copy the iPad/macOS pattern: `[sidebar ~200–260 px][main column]`, sidebar toggleable. The macOS card **grid** is a possible wide-layout alternative but not needed for the MVP cut (current + hourly + 10-day).

---

## Sources

- <a id="s1"></a>[S1] MacRumors — *iOS 27 Weather App: All the New Features* (guide, 2026-06-23): Highlights; Conditions/Precipitation/Wind views; 10-day mode switching; extra-large widget; **no new AI features**; iOS 27 beta + Sept 2026 launch. https://www.macrumors.com/guide/ios-27-weather/
- <a id="s2"></a>[S2] MacRumors — *iOS 27 Tidbits* (2026-06-08): WWDC 2026; Weather "Highlights" + updated hourly/10-day precipitation & wind views. https://www.macrumors.com/2026/06/08/ios-27-tidbits/
- <a id="s3"></a>[S3] 9to5Mac — *Apple Weather gets two brand new features in iOS 27* (2026-06-17): Highlights summary card; Conditions/Precipitation/Wind toggle icons above hourly; Feedback-icon AI clue. https://9to5mac.com/2026/06/17/apple-weather-gets-two-brand-new-features-in-ios-27/
- <a id="s4"></a>[S4] MacRumors — *iOS 27's Weather App Has a New Way to View Forecasts* (2026-06-11): hourly + 10-day precipitation/wind overviews; "currently in beta… released in September"; 4th beta July 20, 2026. https://www.macrumors.com/2026/06/11/ios-27-weather-app-forecast-views/
- <a id="s5"></a>[S5] MacRumors — *iOS 26 Roundup / Mega Guide*: Liquid Glass; WWDC June 9, 2025; Sept 15, 2025 release. https://www.macrumors.com/roundup/ios-26/ · https://www.macrumors.com/guide/ios-26-mega-guide/
- <a id="s6"></a>[S6] MacRumors — *Everything New in the iOS 16 Weather App*: modules + tap-through detail views with parameter switcher; UV module shows current + peak; severe-weather alerts; Dark Sky/WeatherKit. https://www.macrumors.com/guide/ios-16-weather/
- <a id="s7"></a>[S7] MacRumors — *Everything New in the iOS 15 Weather App*: card-style interface; "thousands of animated backgrounds" changing with sun position/clouds/precipitation; 10-day temperature bars; modules. https://www.macrumors.com/guide/ios-15-weather-app/
- <a id="s8"></a>[S8] Apple Human Interface Guidelines — *Typography* (SF Pro sizes/tracking; ≥11 pt; avoid ultralight at small sizes). https://developer.apple.com/design/human-interface-guidelines/typography
- <a id="s9"></a>[S9] *A comparative analysis of pictogram use in mobile weather applications: MGM, AccuWeather, Apple Weather* (DergiPark article): SF + grid typography; temperature primary (largest), city secondary, condition + min/max tertiary; white outline icons + white type on gradient cards. https://dergipark.org.tr/en/download/article-file/5765949
- <a id="s10"></a>[S10] Blake Crosley — *CARROT Weather: Personality as a Design Differentiator*: 72 px temp @ weight 200 as the giant-thin convention; condition→gradient theming ("appearance IS the weather report"); semantic colors (blue precip, red-orange heat, gray overcast); detailed card hierarchy. https://blakecrosley.com/guides/design/carrot-weather
- <a id="s11"></a>[S11] guide4mac — *iOS 27 Weather App Adds Tap-Through Views*: change is navigational, not informational; data/accuracy unchanged; Sept 2026 release; iOS 27 currently in beta. https://guide4mac.com/news/ios-27-weather-app-precipitation-wind/
- <a id="s12"></a>[S12] iamvinny/weather-app (GitHub) — reverse-engineering of the app bundle's 537 `.caml` Mica scenes: 77 scenes (42 conditions × day/night + clear/hot/mostlySunny/rainbow); no CAGradientLayer — VFX computes sky gradient dynamically; storms carry flat sky color; fallback hexes `#4a7ba8`/`#101d2e`/`#2d5580`; VFX has `gradientTop`/`sunAngle` params. https://github.com/iamvinny/weather-app/blob/main/README.md · https://raw.githubusercontent.com/iamvinny/weather-app/main/src/constants/sky.ts
- <a id="s13"></a>[S13] iamvinny/weather-app — generated scene registry (`src/engine/assets.ts`): the full 77-scene condition list. https://raw.githubusercontent.com/iamvinny/weather-app/main/src/engine/assets.ts
- <a id="s14"></a>[S14] designfornative — *UI Changes in iOS 26 That's Not About Liquid Glass*: rounder corners everywhere, more spacing, concentric-corner radii, sentence case. https://designfornative.com/ui-changes-in-ios-26-thats-not-about-liquid-glass/
- <a id="s15"></a>[S15] Apple Support — *Check the weather on iPhone* (iOS 26): hourly swipe; 10-day (conditions, chance of precip, high/low); AQ scale above hourly; tap hourly → change condition; severe alerts; modules list. https://support.apple.com/guide/iphone/check-the-weather-iph1ac0b35f/26/ios/26
- <a id="s16"></a>[S16] AppleInsider — *How to use Apple Weather app* (2025-05-09): "At the top… current temperature and conditions and the high and low for the day. The background… changes to reflect the weather in real-time"; severe alerts/imminent precipitation "directly under the temperature". https://appleinsider.com/inside/ios-19/tips/inside-apple-weather-get-the-most-out-of-apples-own-forecasting-app
- <a id="s17"></a>[S17] macmost — *Getting the Most From the iPhone Weather App*: full screen anatomy (hourly strip, 10-day bars + dot for current temp, UV/Sunset curve/Wind/Precip/Feels-like/Humidity/Visibility/Pressure); 10-day bar = same 10-day min→max scale for every row, color encodes temp. https://macmost.com/getting-the-most-from-the-iphone-weather-app.html
- <a id="s18"></a>[S18] 9to5Mac — *macOS Ventura: Apple's Weather app*: sidebar-detail layout; header over animated background; grid of panels; special warning panel in critical conditions; **UV Index panel**; **Pressure as a radial chart**; pointer-hover charts. https://9to5mac.com/2023/01/08/macos-ventura-weather-app/
- <a id="s19"></a>[S19] Guiding Tech — *How to Use Apple Weather App on iPhone*: top = current temp + predicted high/low; 24-hour card swipe; 10-day card min(left)/max(right); cards UV, Sunset, Wind, Precip, Feels Like, Humidity, Visibility, Pressure; tap card → graph; **long-press + slide to scrub** across 24 h; dates at top. https://www.guidingtech.com/use-apple-weather-app-on-iphone/
- <a id="s20"></a>[S20] Tom's Guide — *iOS 17 Weather severe weather alerts* (2024-02-29): alerts appear "just below the current temperature, but just above the hourly forecast"; also on top of the Rain Forecast box. https://www.tomsguide.com/phones/iphones/ios-weather-app-severe-weather-alerts
- <a id="s21"></a>[S21] Apple HIG skill notes (material model): "Apple Weather exemplifies deference… hourly uses `.thinMaterial`, daily `.regularMaterial`, alert banners `.thickMaterial`". https://github.com/intense-visions/harness-engineering/blob/main/agents/skills/claude-code/design-apple-hig/SKILL.md
- <a id="s22"></a>[S22] Gadget Hacks — *12 Important New Features for Forecasts* (iOS 17): Conditions detail = temp chart + **Chance of Precipitation graph**; "drag your finger across the timeline to see the actual probability for each hour"; daily comparison vs yesterday; dashed lines = historical. https://ios.gadgethacks.com/how-to/apple-weathers-latest-update-gives-you-12-important-new-features-for-forecasts-your-iphone-0385418/
- <a id="s23"></a>[S23] Cult of Mac — *Weather for past week* (2025-06-18): tap-and-hold any graph point for a precise number; scrollable date strip ±9 days; parameter menu (Conditions/UV/Wind/Precip/Feels Like/Humidity/Visibility/Pressure); blue line = actual temp vs average range. https://www.cultofmac.com/how-to/see-past-weather
- <a id="s24"></a>[S24] 9to5Mac — *Hands-on: iOS 15 Weather app* (2021-09-24): dynamic layout — rain in forecast pushes precipitation content to the top; otherwise current conditions + 10-day emphasized; "thousands of variations" of background design/animations reflecting sun position, clouds, precipitation. https://9to5mac.com/2021/09/24/ios-15-weather-app-hands-on/
- <a id="s25"></a>[S25] 9to5Mac — *Here's what's new with iOS and macOS 27 beta 6* (2026-08-17): beta 6 current as of Aug 17, 2026. https://9to5mac.com/2026/08/17/heres-whats-new-with-ios-27-beta-6/
- <a id="s26"></a>[S26] Apple — *All New Features: iOS 26* (PDF, Sept 2025): Weather — Severe Weather Alerts for Significant Locations; Weather widget for Significant Locations. https://www.apple.com/os/pdf/All_New_Features_iOS_26_Sept_2025.pdf
- <a id="s27"></a>[S27] MacRumors — *iOS 16 Weather App Gets Significant Overhaul With Deeper Dark Sky Integration*: Dark Sky technology enhanced and integrated into Weather; WeatherKit API. https://www.macrumors.com/2022/06/08/ios-16-weather-app-update/
- <a id="s28"></a>[S28] YouTube — *The iOS 27 Weather App got an update!* (2026-06-09): beta walkthrough — Highlights section, precipitation "bar graph that fills up if there's a chance of rain", wind view, mode toggles switch the 10-day view and the map. https://www.youtube.com/watch?v=Ch3UQVMlnJA
- <a id="s29"></a>[S29] mt-empty/pi-inky-weather-epd — `src/dashboard/chart.rs`: full SVG hourly-graph implementation — smooth Catmull-Rom→Bézier temp curves; precipitation as per-hour 4-point tapered blocks ("bottom edge tapers from current.y to next.y"); temp y-scale vs 0–100% precip y-scale; opacity scaled by chance. https://github.com/mt-empty/pi-inky-weather-epd/blob/master/src/dashboard/chart.rs
- <a id="s30"></a>[S30] Chris Miles — *Building a native iOS graphing engine for Pocket Weather*: line smoothing via Catmull-Rom; precomputed x→y lookup so a scrub overlay tracks the curve instantly. http://blog.chrismiles.info/2014/01/building-native-ios-graphing-engine-for.html
- <a id="s31"></a>[S31] 9to5Mac — *How to use the new Weather app for iPad (iPadOS 16)*: toggleable locations sidebar with search; cards; tap-through charts. https://9to5mac.com/2022/10/28/how-to-use-the-weather-app-ipad/
- <a id="s32"></a>[S32] Apple Support — *View weather conditions on Mac*: hourly (swipe), 10-day, maps, "click any weather detail"; "move your pointer over a chart to see data for specific times". https://support.apple.com/guide/weather-mac/view-weather-conditions-apdw93f0ea3e/mac
