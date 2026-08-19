import { createEffect, createMemo, createSignal, type Accessor } from 'solid-js'
import { fetchForecast } from './weather/api.ts'
import type { Forecast as ForecastT } from './weather/schema.ts'
import { cacheKey, dayKey } from './weather/cache.ts'
import {
  addPlace,
  listPlaces,
  readForecast,
  removePlace,
  selectPlace,
  selectedPlace,
  writeForecast,
} from './store/db.ts'
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
  /** Saved places for the city list. */
  readonly places: Accessor<readonly Place[]>
  /** The active saved Place, or null when showing Current location / search. */
  readonly selected: Accessor<Place | null>
  readonly loaded: Accessor<boolean>
  readonly add: (place: Place) => void
  readonly remove: (id: number) => void
  readonly select: (id: number | null) => void
}

/** Wire the saved-places list (stretch) + place bootstrap + forecast SWR. */
export const useWeather = (): WeatherApi => {
  const [geo, setGeo] = createSignal<GeoPosition>({
    ok: false,
    latitude: 0,
    longitude: 0,
  })
  const [places, setPlaces] = createSignal<readonly Place[]>([])
  const [selectionId, setSelectionId] = createSignal<number | null>(null)
  const [loaded, setLoaded] = createSignal(false)
  const [forecast, setForecast] = createSignal<ForecastSignal>({
    kind: 'loading',
  })

  const selected = createMemo(
    () => places().find((p) => p.id === selectionId()) ?? null,
  )

  const bootstrap = createMemo((): Bootstrap => {
    const sel = selected()
    if (sel) return { kind: 'pin', place: sel }
    return resolveBootstrap(null, geo())
  })

  const data = createMemo(() => {
    const s = forecast()
    return s.kind === 'ok' || s.kind === 'stale' ? s.forecast : null
  })
  const stale = createMemo(() => forecast().kind === 'stale')
  const offline = createMemo(() => {
    const s = forecast()
    return s.kind === 'stale' ? s.offline : false
  })

  // Load saved places + the active selection once on mount.
  createEffect(
    () => undefined,
    () => {
      void (async () => {
        try {
          const [saved, active] = await Promise.all([
            run(listPlaces()).catch(() => [] as Place[]),
            run(selectedPlace()).catch(() => undefined),
          ])
          setPlaces(saved)
          setSelectionId(active ? active.id : null)
        } finally {
          setLoaded(true)
        }
      })()
    },
  )

  // Geolocate only once loaded and no place is selected (W3 rule).
  createEffect(
    () => `${loaded()}:${selected() ? 'y' : 'n'}`,
    () => {
      if (loaded() && !selected()) {
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

  const add = (place: Place): void => {
    setPlaces((prev) =>
      prev.some((p) => p.id === place.id) ? prev : [...prev, place],
    )
    setSelectionId(place.id)
    void run(addPlace(place)).catch(() => undefined)
  }

  const remove = (id: number): void => {
    setPlaces((prev) => prev.filter((p) => p.id !== id))
    if (selectionId() === id) setSelectionId(null)
    void run(removePlace(id)).catch(() => undefined)
  }

  const select = (id: number | null): void => {
    setSelectionId(id)
    void run(selectPlace(id)).catch(() => undefined)
  }

  return {
    forecast,
    bootstrap,
    data,
    stale,
    offline,
    places,
    selected,
    loaded,
    add,
    remove,
    select,
  }
}
