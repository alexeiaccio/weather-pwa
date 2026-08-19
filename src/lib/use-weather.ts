import { createEffect, createMemo, createSignal, type Accessor } from 'solid-js'
import { Schema } from 'effect'
import { fetchForecast } from './weather/api.ts'
import { Forecast, type Forecast as ForecastT } from './weather/schema.ts'
import { cacheKey, dayKey } from './weather/cache.ts'
import { run } from './runtime.ts'
import { getPosition } from './geolocation.ts'
import {
  loadPin,
  resolveBootstrap,
  savePin,
  type Bootstrap,
  type GeoPosition,
} from '../lib/place/store.ts'
import type { Place } from '../lib/place/schema.ts'

type ForecastSignal =
  | { kind: 'loading' }
  | { kind: 'ok'; forecast: ForecastT }
  | { kind: 'stale'; forecast: ForecastT; offline: boolean }
  | { kind: 'error'; message: string }

const CACHE_KEYS = 'weather:forecast'

const readCache = (key: string): ForecastT | null => {
  try {
    const raw = globalThis.localStorage?.getItem(CACHE_KEYS)
    if (!raw) return null
    const map: Record<string, unknown> = JSON.parse(raw)
    if (!(key in map)) return null
    return Schema.decodeUnknownSync(Forecast)(map[key])
  } catch {
    return null
  }
}

const writeCache = (key: string, forecast: ForecastT): void => {
  try {
    const raw = globalThis.localStorage?.getItem(CACHE_KEYS)
    const map: Record<string, unknown> = raw ? JSON.parse(raw) : {}
    map[key] = forecast
    globalThis.localStorage?.setItem(CACHE_KEYS, JSON.stringify(map))
  } catch {
    /* cache is best-effort */
  }
}

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

/** Wire place bootstrap (W3) + forecast SWR (W6) for the app. */
export const useWeather = (): WeatherApi => {
  const [geo, setGeo] = createSignal<GeoPosition>({
    ok: false,
    latitude: 0,
    longitude: 0,
  })
  const initialPin = loadPin()
  const [pin, setPin] = createSignal<Place | null>(initialPin)
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

  // On mount: resolve geolocation once (denied/unavailable → search state).
  createEffect(
    () => (pin() ? 'pinned' : 'no-pin'),
    () => {
      if (pin()) return
      void getPosition().then(setGeo)
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
    const cacheKeyStr = cacheKey(key, dayKey(Date.now()))
    const cached = readCache(cacheKeyStr)
    if (cached) {
      setForecast({ kind: 'stale', forecast: cached, offline: false })
    }
    void run(fetchForecast(lat, lon))
      .then((f) => {
        writeCache(cacheKeyStr, f)
        setForecast({ kind: 'ok', forecast: f })
      })
      .catch((err: unknown) => {
        if (cached) {
          setForecast({ kind: 'stale', forecast: cached, offline: true })
        } else {
          setForecast({
            kind: 'error',
            message: err instanceof Error ? err.message : String(err),
          })
        }
      })
  })

  const pinPlace = (place: Place): void => {
    savePin(place)
    setPin(place)
  }

  return { forecast, bootstrap, data, stale, offline, pin: pinPlace }
}
