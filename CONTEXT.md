# Weather PWA Context

The weather app shows current conditions, an hourly temperature graph, and a 10-day forecast for exactly one place at a time.

## Language

**Place**:
A named location picked by the user through search, stored as the full geocoded object (`id`, `name`, `latitude`, `longitude`, `admin1`, `country`, `timezone`). A Place always carries a display name — it never comes from raw coordinates.
_Avoid_: city, location

**Current location**:
The live device position from the Geolocation API — raw coordinates at a moment in time, never carrying a name. The header shows a generic "Current location" chip whenever the app is showing it.
_Avoid_: my location, GPS position, geo position

**Pin / pinned place**:
The single saved Place, persisted in IndexedDB. After the first run it wins over geolocation on launch — no permission prompt is re-shown while a pin exists.
_Avoid_: saved city, bookmark, selected location

**Search empty state**:
The cold-start state shown when there is no pin yet and geolocation is denied or unavailable: the search box with a gentle prompt to pick a Place. No hardcoded default city exists.
_Avoid_: fallback city, default location