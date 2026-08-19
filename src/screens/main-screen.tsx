import { For } from 'solid-js'
import type { JSX } from '@solidjs/web'
import { APP_VERSION } from '../lib/version'

/**
 * Static first cut of the MVP screen — W5 prototype variant A (Glass faithful)
 * rendered with the W2 design tokens. Data is a tiny fixture for now; the
 * W7 data layer (Effect services + IndexedDB) replaces it in the real build.
 */
const FIXTURE = {
  place: { name: 'Current location' },
  current: { temp: 16, condition: 'Partly Cloudy', hi: 24, lo: 8, feels: 15 },
  quarter: [
    { label: 'Feels Like', value: '15°' },
    { label: 'Wind', value: '12 km/h' },
    { label: 'Humidity', value: '58%' },
    { label: 'Pressure', value: '1015 hPa' },
  ],
  days: [
    { day: 'Today', icon: '⛅', pp: 40, min: 8, max: 24 },
    { day: 'Mon', icon: '🌧️', pp: 70, min: 9, max: 21 },
    { day: 'Tue', icon: '⛅', pp: 20, min: 10, max: 23 },
  ],
}

const skyStyle = (): string => {
  return 'linear-gradient(180deg, #5b8fc0 0%, #4a7ba8 55%, #3c658f 100%)'
}

const Card = (props: { title: string; children: unknown }): JSX.Element => (
  <section class="rounded-[26px] border border-white/10 bg-card px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl">
    <h2 class="mb-2 text-[13px] font-normal tracking-[1.1px] text-ink-2 uppercase">
      {props.title}
    </h2>
    {props.children}
  </section>
)

export default function MainScreen() {
  const d = FIXTURE
  return (
    <div
      class="mx-auto min-h-full w-full max-w-[472px] px-4 pt-10 pb-24"
      style={{ background: skyStyle() }}
    >
      <div class="text-center">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur-md">
          📍 {d.place.name}
        </span>
        <div class="mt-1 text-[clamp(96px,28vw,220px)] leading-none font-extralight tracking-[-0.02em]">
          {d.current.temp}°
        </div>
        <div class="text-[30px] font-light">
          {d.current.condition}
          <span class="ml-3 text-[19px] font-normal text-ink-2">
            H:{d.current.hi}° L:{d.current.lo}°
          </span>
        </div>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-3.5">
        <For each={d.quarter}>
          {(m) => (
            <Card title={m.label}>
              <p class="text-[22px] font-medium">{m.value}</p>
            </Card>
          )}
        </For>
      </div>

      <div class="mt-3.5">
        <Card title="Hourly Forecast">
          <p class="text-sm text-ink-2">
            Scrubbing temperature curve lands here (W5 recipe — hand-rolled
            SVG).
          </p>
        </Card>
      </div>

      <div class="mt-3.5">
        <Card title="10-Day Forecast">
          <For each={d.days}>
            {(row) => (
              <div class="grid grid-cols-[58px_64px_26px_1fr_26px] items-center gap-2 border-t border-white/10 py-2.5 text-[17px] first:border-t-0">
                <span class="font-medium">{row.day}</span>
                <span>
                  {row.icon}
                  {row.pp > 0 ? (
                    <span class="ml-1 text-xs font-semibold text-accent-blue">
                      {row.pp}%
                    </span>
                  ) : null}
                </span>
                <span class="text-right text-ink-2">{row.min}°</span>
                <span class="h-1.5 rounded bg-white/15">
                  <span class="block h-full w-3/4 rounded bg-gradient-to-r from-[#6fb5ff] to-[#ffd26b]" />
                </span>
                <span class="text-right font-medium">{row.max}°</span>
              </div>
            )}
          </For>
        </Card>
      </div>

      <p class="mt-4 text-center text-xs text-ink-3">
        Updated just now · Weather data by Open-Meteo.com · {APP_VERSION}
      </p>
    </div>
  )
}
