import { createSignal, Show } from 'solid-js'
import type { JSX } from '@solidjs/web'
import { useWeather } from '../lib/use-weather.ts'
import {
  conditionGlyph,
  conditionLabel,
  skyFor,
} from '../lib/weather/conditions.ts'
import { placeString } from '../lib/place/store.ts'
import { APP_VERSION } from '../lib/version.ts'
import { conditionToAtmos } from '../lib/atmos.ts'
import { useAtmosphere } from '../lib/use-atmosphere.ts'
import { HourlyGraph } from '../components/hourly-graph.tsx'
import { TenDay } from '../components/ten-day.tsx'
import { RadarMap } from '../components/radar-map.tsx'
import { Sky3D } from '../components/sky-3d.tsx'
import { PlaceSearch } from '../components/place-search.tsx'
import { PlacesPanel } from '../components/places-panel.tsx'
import type { Bootstrap } from '../lib/place/store.ts'
import type { Forecast as ForecastT } from '../lib/weather/schema.ts'

const skyStyle = (f: ForecastT): string => {
  const s = skyFor(f.current.code, f.current.isDay)
  return `linear-gradient(180deg, ${s.top} 0%, ${s.bottom} 100%)`
}

const Card = (props: { title: string; children: unknown }): JSX.Element => (
  <section
    data-atmos-glass
    data-atmos-collision
    class="rounded-[26px] border border-white/10 bg-card px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl"
  >
    <h2 class="mb-2 text-[13px] font-normal tracking-[1.1px] text-ink-2 uppercase">
      {props.title}
    </h2>
    {props.children}
  </section>
)

const MetricCard = (props: { title: string; value: string }): JSX.Element => (
  <Card title={props.title}>
    <p class="text-[22px] font-medium">{props.value}</p>
  </Card>
)

const timeAgo = (fetchedAt: number): string => {
  const mins = Math.max(0, Math.round((Date.now() - fetchedAt) / 60_000))
  if (mins < 1) return 'just now'
  return `${mins} min${mins === 1 ? '' : 's'} ago`
}

const ForecastView = (props: {
  b: Bootstrap
  f: ForecastT
  stale: boolean
  offline: boolean
  onEdit: () => void
  onOpenList: () => void
}): JSX.Element => {
  const cur = props.f.current
  const title =
    props.b.kind === 'pin' ? placeString(props.b.place) : 'Current location'
  const center =
    props.b.kind === 'pin'
      ? { lat: props.b.place.latitude, lon: props.b.place.longitude }
      : props.b.kind === 'current'
        ? { lat: props.b.latitude, lon: props.b.longitude }
        : undefined
  // The forecast root doubles as the atmos-fx DOM-aware precipitation layer.
  const [rootEl, setRootEl] = createSignal<HTMLElement | undefined>(undefined)
  useAtmosphere(rootEl, () => conditionToAtmos(cur.code), { density: 0.6 })
  return (
    <div
      ref={(el) => setRootEl(el)}
      data-atmos-root
      class="relative mx-auto min-h-full w-full max-w-[472px] px-4 pt-10 pb-24"
      style={{ background: skyStyle(props.f) }}
    >
      {/* Animated Three.js sky; the CSS gradient above is its fallback. */}
      <Sky3D code={cur.code} isDay={cur.isDay} />
      <div class="relative z-10">
        <button
          type="button"
          aria-label="Saved places"
          onClick={props.onOpenList}
          class="fixed top-4 left-4 tap rounded-full bg-white/15 px-3 py-2 text-white backdrop-blur-md hover:bg-white/25"
        >
          ☰
        </button>
        <div class="text-center">
          <button
            type="button"
            onClick={props.onEdit}
            class="group inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur-md"
          >
            <span>{title}</span>
            <span class="text-ink-3 group-hover:text-white">✎</span>
          </button>
          <div class="mt-1 text-[clamp(96px,28vw,220px)] leading-none font-extralight tracking-[-0.02em]">
            {Math.round(cur.temp)}°
          </div>
          <div class="text-[30px] font-light">
            {conditionGlyph(cur.code)} {conditionLabel(cur.code)}
            <span class="ml-3 text-[19px] font-normal text-ink-2">
              H:
              {Math.round(Math.max(...props.f.daily.map((d) => d.max)))}° L:
              {Math.round(Math.min(...props.f.daily.map((d) => d.min)))}°
            </span>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3.5">
          <MetricCard title="Feels Like" value={`${Math.round(cur.feels)}°`} />
          <MetricCard title="Wind" value={`${Math.round(cur.windKmh)} km/h`} />
          <MetricCard title="Humidity" value={`${Math.round(cur.humidity)}%`} />
          <MetricCard
            title="Pressure"
            value={`${Math.round(cur.pressureHpa)} hPa`}
          />
        </div>

        <div class="mt-3.5">
          <Card title="Hourly Forecast">
            <HourlyGraph forecast={props.f} />
          </Card>
        </div>

        <div class="mt-3.5">
          <Card title="10-Day Forecast">
            <TenDay days={props.f.daily} currentTemp={cur.temp} />
          </Card>
        </div>

        <Show when={center} fallback={null}>
          {(c) => (
            <div class="mt-3.5">
              <Card title="Precipitation">
                <RadarMap lat={c().lat} lon={c().lon} />
              </Card>
            </div>
          )}
        </Show>

        <p class="mt-4 text-center text-xs text-ink-3">
          <Show when={props.offline}>
            <span class="font-semibold text-alert-red">Offline · </span>
          </Show>
          Updated {timeAgo(props.f.fetchedAt)}
          {props.stale && !props.offline ? ' · refreshing…' : ''}
          {' · '}Weather data by Open-Meteo.com · {APP_VERSION}
        </p>
      </div>
    </div>
  )
}

export default function MainScreen(): JSX.Element {
  const w = useWeather()
  const [editing, setEditing] = createSignal(false)
  const [showPlaces, setShowPlaces] = createSignal(false)
  const b = w.bootstrap
  const bKind = (): Bootstrap['kind'] => b().kind
  const viewing = (): boolean => !editing() && bKind() !== 'search'

  return (
    <div data-testid="weather-screen" class="min-h-full">
      <PlacesPanel
        open={showPlaces()}
        places={w.places()}
        selected={w.selected()}
        onClose={() => setShowPlaces(false)}
        onSelect={(id) => w.select(id)}
        onRemove={(id) => w.remove(id)}
        onAdd={(place) => w.add(place)}
        onMove={(id, dir) => w.move(id, dir)}
      />
      <Show
        when={viewing()}
        fallback={
          <div class="mx-auto max-w-[472px] px-4 pt-10 pb-24">
            <h1 class="mb-1 text-[30px] font-light">Weather</h1>
            <p class="mb-5 text-[15px] text-ink-2">
              {editing()
                ? 'Choose the place to show.'
                : 'Turn on location, or pin a city below.'}
            </p>
            <PlaceSearch
              onSelect={(place) => {
                w.add(place)
                setEditing(false)
              }}
            />
          </div>
        }
      >
        <Show
          when={w.data()}
          fallback={
            <div class="flex min-h-full items-center justify-center text-ink-2">
              {w.forecast().kind === 'error' ? (
                <div class="mx-auto max-w-[472px] px-4 py-24 text-center">
                  <p class="text-3xl">😕</p>
                  <p class="mt-2">
                    Could not load the forecast. Check your connection and try
                    again.
                  </p>
                </div>
              ) : (
                <div class="flex flex-col items-center gap-2">
                  <p class="text-3xl">⛅</p>
                  <p>Loading forecast…</p>
                </div>
              )}
            </div>
          }
        >
          {(f) => (
            <ForecastView
              b={b()}
              f={f()}
              stale={w.stale()}
              offline={w.offline()}
              onEdit={() => setEditing(true)}
              onOpenList={() => setShowPlaces(true)}
            />
          )}
        </Show>
      </Show>
    </div>
  )
}
