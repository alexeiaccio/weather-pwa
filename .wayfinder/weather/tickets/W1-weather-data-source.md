---
id: W1
title: Weather data source and client contract
type: research
status: closed
blocked_by: []
assigned:
---

## Question

Which weather data provider powers the app, and what is the exact client-side contract?

The PWA runs in the browser on `weather.accio.blue` and fetches **directly from the client** (no backend in v1). It must supply, for an arbitrary latitude/longitude:

- current conditions (temp, condition, feels-like, wind, humidity, UV, visibility, pressure, sunrise/sunset, high/low),
- hourly forecast (≥24h, ideally 7 days) including precipitation probability / amount for the iOS-style band under the curve,
- daily forecast for **10 days**,
- a place name / reverse geocoding for the pinned location,
- ideally severe-weather alerts + precipitation data for the stretch radar later.

Evaluate at least: **Open-Meteo** (free, no key, CORS), **Apple WeatherKit Web** (real Apple/Dark Sky data, web SDK — needs an Apple Developer account + token), **OpenWeatherMap**, **WeatherAPI.com**, and any other credible candidate. For each: free-tier limits, CORS headers, auth/key burden, field coverage vs. the list above, forecast accuracy/reputation, ease of caching, privacy stance.

Deliverable: the chosen API plus the concrete request/response shapes the data layer will bind to.

## Resolution

**Chosen: Open-Meteo** (api.open-meteo.com + geocoding-api.open-meteo.com) — the only candidate that meets the no-backend, browser-only constraint with zero friction: free for non-commercial use, no key/sign-up, official CORS, and every required field (current incl. feels-like/UV/visibility/pressure, hourly with precip probability + amount, 10-day daily, geocoding, air quality) live-verified in one GET contract. Accuracy comes from best-match stitching of national models (ECMWF IFS, ICON-D2, HRRR, AROME); CC BY 4.0 attribution required. Runners-up were ruled out: Apple WeatherKit needs a paid ADP membership and a server-side JWT token service (Apple's own docs) and fails browser preflight; WeatherAPI.com free tier caps at 3-day forecast; tomorrow.io free caps at 500 calls/day and 5 days. Alerts/radar (stretch) sit outside Open-Meteo via free keyless NWS/MeteoAlarm/RainViewer. Full report: `.wayfinder/weather/research/W1-weather-data-source.md`.