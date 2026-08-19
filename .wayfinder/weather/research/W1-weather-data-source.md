# W1 — Weather data source and client contract

Researched 2026-08-19. Live-verified: Open-Meteo forecast/geocoding/air-quality calls, CORS headers for OpenWeatherMap, WeatherAPI.com, NWS; Apple WeatherKit via primary docs + developer-forum evidence.

## Decision

**Provider: Open-Meteo (api.open-meteo.com + geocoding-api.open-meteo.com).**

It is the only credible candidate that satisfies the hard constraint — fetch directly from the browser, no backend — with **zero friction**: free for non-commercial use, **no API key, no sign-up, official CORS support** ("CORS supported, no ads, no tracking, not even cookies"), plain GET JSON. One endpoint covers every required field: current conditions (temp, feels-like, wind, humidity, WMO condition code, UV, visibility, pressure, sunrise/sunset, high/low), 7-day hourly (up to 16) with `precipitation_probability` + `precipitation`, and 10-day daily — all live-verified 2026-08-19. Accuracy comes from stitching the best national NWP models (ECMWF IFS 9 km, ICON-D2, HRRR, AROME, GFS…) with automatic per-location `best_match` — top-tier quality without vendor lock, and the data is CC BY 4.0. Privacy is best-in-class for a client-only app: no cookies, no tracking, nothing to leak, cache-friendly stable GET URLs. Only gap: no severe-weather alerts endpoint (maintainer explicitly deferred it, issue #828) — handled as a stretch goal with free keyless complements (NWS for US, MeteoAlarm for EU, RainViewer for radar tiles).

## Comparison table

| Criterion | **Open-Meteo** ✅ | Apple WeatherKit | OpenWeatherMap | WeatherAPI.com | tomorrow.io | Visual Crossing |
|---|---|---|---|---|---|---|
| Browser fetch (no backend) | ✅ **No key, CORS documented** | ❌ JWT must be signed by a **server token service**; preflight 403s from browsers | ⚠️ Key in URL; CORS undocumented (ACAO `*` today, OPTIONS 405 historically) | ⚠️ Key in URL; CORS `*` live-verified, browser JS examples official | ⚠️ Key in URL; CORS per directory only | ⚠️ Key in URL; CORS officially documented |
| Free tier | 10,000 calls/day, 600/min, 5,000/hr, 300k/mo | 500k calls/mo — **but $99/yr ADP membership** | 1M calls/mo (60/min) + One Call 1,000/day free | 100k calls/mo | **500/day, 25/hr, 3/sec** | 1,000 **records**/day (≈10 records = one 10-day call) |
| Current conditions (temp/feels/wind/humidity/UV/vis/pressure) | ✅ all | ✅ all | ✅ all (One Call) | ✅ all | ✅ | ✅ |
| Hourly ≥24h (precip prob + amount) | ✅ 168 h default, 240+ via forecast_days=16, `precipitation_probability` | ✅ 240 h + next-hour minutely | ✅ (One Call) | ✅ 7 d on paid; free tier 3 d | ✅ 5 d max (free) | ✅ |
| **Daily 10 days** | ✅ `forecast_days=10` | ✅ 10 d | ✅ 16 d | ❌ free = 3 d (10 d = Pro+ $25/mo) | ❌ free = 5 d | ✅ 15 d |
| Place name / geocoding | ✅ dedicated Geocoding API (forward; no reverse) | ❌ none (no geocoding in WeatherKit) | ✅ Geocoding API (free bundle) | ✅ Search API | ✅ locations API | ⚠️ location param, weak name data |
| Severe-weather alerts | ❌ none (use NWS/MeteoAlarm) | ✅ weatherAlerts dataset | ✅ (One Call) | ⚠️ "Limited" on free | ⚠️ 1 alert (free) | ⚠️ limited |
| Precipitation/radar | ✅ `minutely_15` band + RainViewer tiles | ✅ forecastNextHour | ✅ minutely (One Call) | ⚠️ | ✅ | ⚠️ |
| Accuracy/reputation | ✅ best_match of ECMWF/ICON/HRRR/AROME; transparent model list | ✅⭐ Apple Weather (Dark Sky lineage), best-in-class | ⚠️ good, model-dependent | ⚠️ good, aggregated | ⚠️ good | ⚠️ good data broker |
| Cache-friendliness | ✅ stable GET URLs, `generationtime_ms`, no key | ⚠️ token expiry, key lifetime | ⚠️ key, per-account quota | ⚠️ key, monthly quota | ⚠️ tight quotas | ⚠️ record-quota burn |
| Privacy | ✅ no cookies/tracking/ads, keyless | ✅ Apple privacy stance | ⚠️ key + analytics | ⚠️ key | ⚠️ | ⚠️ |
| License/attribution | CC BY 4.0 (link required) | Apple Weather mark + link | ODbL + text/logo | link appreciated (free) | ToS | ToS |

**Deal-breakers of the runners-up** — Apple WeatherKit: explicitly requires "on your server, you'll deploy a token service" for the ES256 JWT (Apple docs) → violates the no-backend constraint; no official JS SDK; browser preflight failures documented. WeatherAPI.com: 3-day forecast on free kills the 10-day daily requirement. tomorrow.io: 500/day–25/hr caps and 5-day free forecast. OpenWeatherMap/Visual Crossing: workable but key-in-browser quota risk and (OWM) undocumented/inconsistent CORS; Visual Crossing's record-based quota burns on 10-day calls.

## Client contract

All calls are plain `GET`, JSON, **no auth headers, no key**. CORS is handled by Open-Meteo (wildcard). The data layer binds to the shapes below.

### 1. Forecast — `https://api.open-meteo.com/v1/forecast` (primary)

Request (the app always sends these params; units are overridable):

```
https://api.open-meteo.com/v1/forecast
  ?latitude=52.52&longitude=13.41
  &current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,
          pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,visibility
  &hourly=temperature_2m,apparent_temperature,weather_code,precipitation_probability,
          precipitation,rain,showers,snowfall,uv_index
  &daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,
         precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max
  &timezone=auto&forecast_days=10&wind_speed_unit=kmh
```

Notes: `timezone=auto` resolves the location's local zone server-side. `forecast_days=10` yields 10 daily rows + 240 hourly rows. The OpenAPI `current` enum lags the live API for `uv_index`/`visibility` — **both verified working live 2026-08-19**.

Trimmed response (live, Berlin):

```jsonc
{
  "latitude": 52.52, "longitude": 13.42, "elevation": 38.0,
  "generationtime_ms": 0.82, "utc_offset_seconds": 7200,
  "timezone": "Europe/Berlin", "timezone_abbreviation": "GMT+2",
  "current_units": { "temperature_2m": "°C", "weather_code": "wmo code", "wind_speed_10m": "km/h",
                     "uv_index": "", "visibility": "m", "pressure_msl": "hPa", ... },
  "current": {
    "time": "2026-08-19T10:15", "interval": 900,
    "temperature_2m": 18.8, "apparent_temperature": 18.9, "relative_humidity_2m": 78,
    "weather_code": 61, "is_day": 1, "wind_speed_10m": 11.1, "wind_direction_10m": 245,
    "wind_gusts_10m": 22.0, "uv_index": 2.65, "visibility": 29460, "pressure_msl": 1006.5
  },
  "hourly": {
    "time": ["2026-08-19T00:00", "2026-08-19T01:00", /* ... 240 entries ... */],
    "temperature_2m": [16.4, 16.2, /* ... */],
    "precipitation_probability": [85, 80, /* ... */],   // % — the iOS-style band value
    "precipitation": [0.9, 0.4, /* ... */],             // mm
    "weather_code": [61, 61, /* ... */]
  },
  "daily": {
    "time": ["2026-08-19", "2026-08-20", /* ... 10 entries ... */],
    "weather_code": [61, 3, ...],
    "temperature_2m_max": [20.9, 24.3, ...], "temperature_2m_min": [17.0, 16.1, ...],
    "sunrise": ["2026-08-19T05:55", ...], "sunset": ["2026-08-19T20:24", ...],
    "uv_index_max": [2.55, 5.15, ...], "precipitation_sum": [6.7, 0.2, ...],
    "precipitation_probability_max": [85, 13, ...]
  }
}
```

Data-layer bindings:

| UI need | Field(s) |
|---|---|
| temp / feels-like | `current.temperature_2m` / `current.apparent_temperature` |
| condition + icon | `current.weather_code` (WMO 0–99) + `current.is_day` (day/night icon variant); local table maps codes → condition text/icon |
| wind | `current.wind_speed_10m` + `wind_direction_10m` (+ `wind_gusts_10m`) |
| humidity / UV / visibility / pressure | `current.relative_humidity_2m` / `uv_index` / `visibility` (m) / `pressure_msl` (hPa) |
| today's high/low | `daily.temperature_2m_max[0]` / `daily.temperature_2m_min[0]` |
| sunrise/sunset | `daily.sunrise[0]` / `daily.sunset[0]` (also per day for the daily strip) |
| hourly band (≥24 h) | `hourly.time[]` + `temperature_2m[]`, `precipitation_probability[]` + `precipitation[]` (mm/h) |
| precipitation band (sub-hour, iOS-style) | `minutely_15=precipitation,precipitation_probability` (HRRR/ICON-D2/AROME-native, interpolated elsewhere) |
| 10-day daily strip | `daily.*` arrays (`weather_code`, max/min, precip prob max, UV max) |

### 2. Geocoding / place name — `https://geocoding-api.open-meteo.com/v1/search` (forward)

```
https://geocoding-api.open-meteo.com/v1/search?name=Berlin&count=10&language=en
```

```jsonc
{ "results": [{
    "id": 2950159, "name": "Berlin", "latitude": 52.52437, "longitude": 13.41053,
    "elevation": 74.0, "feature_code": "PPLC", "country_code": "DE", "country": "Germany",
    "admin1": "State of Berlin", "timezone": "Europe/Berlin", "population": 3426354
  }] }
```

The app stores the whole place object `{id, name, latitude, longitude, admin1, country, timezone}` and passes its `latitude/longitude` (+ `timezone`) to the forecast call — so the pinned location always carries its display name. (Forward-only: no reverse-geocoding endpoint. Not needed for v1 because every pin originates from a search result; if a freeform map-drop arrives later, add Nominatim/BigDataCloud reverse as a separate small call.)

### 3. Bonus: air quality — `https://air-quality-api.open-meteo.com/v1/air-quality` (CAMS-based)

```
.../v1/air-quality?latitude=52.52&longitude=13.41&current=us_aqi,european_aqi,pm2_5,pm10&forecast_days=3
```

### 4. Stretch goals (not Open-Meteo)

- **Severe-weather alerts** — Open-Meteo has none (maintainer-deferred; verified 404 + issue #828). Free keyless alternatives, both CORS `*` (live-verified NWS):
  - NWS (US): `https://api.weather.gov/alerts/active?point=LAT,LON` → GeoJSON FeatureCollection of active alerts (free, no key, CORS `*`).
  - MeteoAlarm (EU): `https://api.meteoalarm.org/edr/v1` — free public access via MeteoGate; token registration for direct API.
- **Radar tiles** — RainViewer (free, keyless): `https://api.rainviewer.com/public/weather-maps.json` → tile URLs + timestamps (live-verified).

### Units, caching, attribution

- Units: recommend `temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm` with a user toggle (fahrenheit/mph/inch all supported server-side).
- Caching: stable GET URLs, no key → ideal for a service worker / IndexedDB cache keyed by `(rounded lat/lon, query, date)`. TTLs: current ≈10 min, hourly ≈1 h, daily ≈6 h (matches model cadence: global models every 6 h, high-res 1–3 h). Use `generationtime_ms` if desired; timestamps are ISO-8601 local (after `timezone=auto`).
- Attribution (CC BY 4.0): display "Weather data by Open-Meteo.com" linked to open-meteo.com. Free tier is non-commercial (10k/day); commercial use needs a paid customer-API subscription — same syntax, just `customer-api.open-meteo.com` + `apikey`.

## Sources

**Open-Meteo**
- Forecast API docs (params: `current`/`hourly`/`daily`, `forecast_days` 0–16, `timezone=auto`, units, `apikey` only for commercial): https://open-meteo.com/en/docs
- Free-tier limits (10,000/day, 600/min, 5,000/hr, 300k/mo; commercial plans; customer endpoint): https://open-meteo.com/en/pricing
- "No API key required, CORS supported, no ads, no tracking, not even cookies"; CC BY 4.0; AGPLv3; non-commercial free: https://github.com/open-meteo/open-meteo
- Model stitching, 15+ national weather services, `best_match` auto-selection, update cadence (global 6 h, high-res 1–3 h): https://open-meteo.com/en/features
- Geocoding API (search params, result fields): https://open-meteo.com/en/docs/geocoding-api
- Air Quality API (CAMS; us_aqi/european_aqi): https://open-meteo.com/en/docs/air-quality-api
- Full machine-readable variable enums (forecast OpenAPI 3.1): https://raw.githubusercontent.com/open-meteo/open-meteo/main/openapi/forecast.yml
- Alerts not planned: https://github.com/open-meteo/open-meteo/issues/828 and https://github.com/open-meteo/open-meteo/discussions/183
- Live verification 2026-08-19: forecast (240 hourly + 10 daily, uv/visibility in `current`), geocoding, air-quality, alerts-404 (https://api.open-meteo.com/v1/alerts → `{"error":true,"reason":"Not Found"}`)

**Apple WeatherKit**
- ADP membership required; REST for "websites and other platforms"; 500,000 calls/mo included: https://developer.apple.com/weatherkit/get-started/ and https://developer.apple.com/help/account/services/weatherkit/
- JWT ES256 with private key; "Never distribute your private key… create an authenticated service to create and sign your own tokens": https://developer.apple.com/documentation/weatherkitrestapi/request-authentication-for-weatherkit-rest-api
- WWDC22 "Meet WeatherKit" (dataSets incl. `weatherAlerts`, `forecastNextHour`, 240 h hourly, 10-day daily; "on your server, you'll deploy a token service"; attribution): https://developer.apple.com/videos/play/wwdc2022/10003
- Browser preflight (OPTIONS) fails with 403 from Safari/Chrome: https://developer.apple.com/forums/thread/737100 ; unofficial spec confirms "Due to CORS restrictions, direct API calls from the Swagger UI won't work": https://github.com/codybrom/weatherkit-openapi
- Response headers show `Access-Control-Allow-Origin: *` (but preflight still fails — auth header triggers OPTIONS): https://developer.apple.com/forums/thread/757910
- No official JS/web SDK exists — only Swift framework + REST API (docs never mention a JS SDK).

**OpenWeatherMap**
- Free plan (60 calls/min, 1M/month) + One Call 4.0 first 1,000 calls/day free: https://openweathermap.org/price
- API key (APPID) required for every call; account-level quotas; free = classic endpoints only (One Call is pay-per-call): https://openweathermap.org/appid
- One Call 3.0/4.0 (minutely, hourly pop, daily, alerts): https://openweathermap.org/api/one-call-3
- CORS: live-verified `Access-Control-Allow-Origin: *` on api.openweathermap.org (2026-08-19); but OPTIONS preflight returned 405 (2022): https://stackoverflow.com/questions/73474314 ; earlier missing-header reports: https://stackoverflow.com/questions/67832626 — CORS is undocumented and behavior has been inconsistent.
- Independent 2026 review of free-tier framing: https://apiscout.dev/guides/openweathermap-free-tier-limits-2026

**WeatherAPI.com**
- Pricing (free 100k calls/mo; Forecast = 3-day on free, 7-day Starter, 300-day Pro+; Alerts "Limited" on free): https://www.weatherapi.com/pricing.aspx
- Docs/endpoints + key param; error model: https://www.weatherapi.com/docs/
- Browser usage official ("The library also works in the browser environment"): https://github.com/weatherapicom/javascript
- CORS: live-verified `access-control-allow-origin: *` on api.weatherapi.com (2026-08-19).

**tomorrow.io**
- Free plan rate limits (500/day, 25/hr, 3/sec): https://support.tomorrow.io/hc/en-us/articles/20273728362644-Free-API-Plan-Rate-Limits
- Free plan scope (5-day forecast, 1 monitored location, 1 alert; platform excluded): https://support.tomorrow.io/hc/en-us/articles/23554984091156-Tomorrow-io-Pricing-Overview
- API key auth, keep key server-side: https://docs.tomorrow.io/reference/api-authentication

**Visual Crossing**
- Free plan (1,000 records/day, API key, Query Builder + full API): https://www.visualcrossing.com/resources/documentation/visual-crossing-weather-free-plan-free-weather-data-for-analysts-and-api-developers/
- CORS documented ("The Visual Crossing Weather API already supports the necessary headers"): https://www.visualcrossing.com/resources/blog/how-to-use-cors-with-a-restful-weather-api/
- Timeline API (single call, current + 15-day forecast): https://www.visualcrossing.com/weather-api/

**Stretch-goal complements**
- NWS API (free, no key, alerts; CORS `*` live-verified): https://www.weather.gov/documentation/services-web-api
- MeteoAlarm EDR (EU alerts; free public via MeteoGate, token for API): https://api.meteoalarm.org/
- RainViewer radar (free, keyless): live-verified https://api.rainviewer.com/public/weather-maps.json
