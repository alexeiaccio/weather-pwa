import { createEffect, createMemo, createSignal, type Accessor } from 'solid-js'
import { fetchForecast } from './weather/api.ts'
import type { Forecast as ForecastT } from './weather/schema.ts'
import { cacheKey, dayKey } from './weather/cache.ts'
import { readForecast, readPin, writeForecast, writePin } from './store/db.ts'
import { run } from './runtime.ts'
import { getPosition } from './geolocation.ts'
import {
  resolveBootstrap,
  type Bootstrap,
  type GeoPosition,
} from '../lib/place/store.ts'
import type { Place } from '../lib/place/schema.ts'

type ForecastSignal =
  | { kind: 'loading' }
  | { kind: 'ok'; forecast: ForecastT }
  | { kind: 'stale'; forecast: ForecastT; offline: boolean }
  | { kind: 'error'; message: string }

const coordsOf = (b: Bootstrap): { lat: number; lon: number } | undefined => {
  if (b.kind === 'current') return { lat: b.latitude, lon: b.longitude }
  if (b.kind === 'pin') return { lat: b.place.latitude, lon: b.place.longitude }
  return undefined
}

export interface WeatherApi {
  readonly forecast: Accessor<ForecastSignal>
  readonly bootstrap: Accessor<Bootstrap>
  readonly data: Accessor<ForecastT | null>
  readonly stale: Accessor<boolean>
  readonly offline: Accessor<boolean>
  readonly pin: (place: Place) => void
}

/** Wire place bootstrap (W3) + forecast SWR (W6) against IndexedDB (W7). */
export const useWeather = (): WeatherApi => {
  const [geo, setGeo] = createSignal<GeoPosition>({
    ok: false,
    latitude: 0,
    longitude: 0,
  })
  const [pin, setPin] = createSignal<Place | null>(null)
  const [pinLoaded, setPinLoaded] = createSignal(false)
  const [forecast, setForecast] = createSignal<ForecastSignal>({
    kind: 'loading',
  })

  // W3 bootstrap as a memo so consumers read it reactively in JSX.
  const bootstrap = createMemo(() => resolveBootstrap(pin(), geo()))
  // Reactive derived views of the forecast signal.
  const data = createMemo(() => {
    const s = forecast()
    return s.kind === 'ok' || s.kind === 'stale' ? s.forecast : null
  })
  const stale = createMemo(() => forecast().kind === 'stale')
  const offline = createMemo(() => {
    const s = forecast()
    return s.kind === 'stale' ? s.offline : false
  })

  // Load the pinned place from IndexedDB once on mount.
  createEffect(
    () => undefined,
    () => {
      void run(readPin)
        .then((place) => {
          setPin(place)
          setPinLoaded(true)
        })
        .catch(() => setPinLoaded(true))
    },
  )

  // Geolocate only once the pin is loaded and there is none (W3 rule).
  createEffect(
    () => `${pinLoaded()}:${pin() ? 'p' : 'n'}`,
    () => {
      if (pinLoaded() && !pin()) {
        void getPosition().then(setGeo)
      }
    },
  )

  // On coords change: SWR — show cache instantly, then fetch live and swap.
  const coordsKey = (): string | undefined => {
    const c = coordsOf(bootstrap())
    return c ? `${c.lat},${c.lon}` : undefined
  }

  createEffect(coordsKey, (key) => {
    if (!key) {
      setForecast({ kind: 'loading' })
      return
    }
    const [lat, lon] = key.split(',').map((n) => Number(n))
    const storeKey = cacheKey(key, dayKey(Date.now()))
    void (async () => {
      let cached: ForecastT | undefined
      try {
        cached = await run(readForecast(storeKey)).catch(() => undefined)
      } catch {
        cached = undefined
      }
      if (cached) {
        setForecast({ kind: 'stale', forecast: cached, offline: false })
      }
      try {
        const f = await run(fetchForecast(lat, lon))
        await run(writeForecast(storeKey, f)).catch(() => undefined)
        setForecast({ kind: 'ok', forecast: f })
      } catch (err) {
        if (cached) {
          setForecast({ kind: 'stale', forecast: cached, offline: true })
        } else {
          setForecast({
            kind: 'error',
            message: err instanceof Error ? err.message : String(err),
          })
        }
      }
    })()
  })

  const pinPlace = (place: Place): void => {
    void run(writePin(place))
      .then(() => setPin(place))
      .catch(() => setPin(place))
  }

  return { forecast, bootstrap, data, stale, offline, pin: pinPlace }
}
