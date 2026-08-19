import { createSignal, For, Show } from 'solid-js'
import type { JSX } from '@solidjs/web'
import { Sky3D } from '../components/sky-3d.tsx'
import { useAtmosphere } from '../lib/use-atmosphere.ts'
import type { AtmosPreset } from '../lib/atmos.ts'

const CONDITIONS: ReadonlyArray<{
  label: string
  code: number
  isDay: number
}> = [
  { label: 'Clear day', code: 0, isDay: 1 },
  { label: 'Cloudy', code: 3, isDay: 1 },
  { label: 'Rain', code: 63, isDay: 1 },
  { label: 'Snow', code: 73, isDay: 1 },
  { label: 'Thunder', code: 95, isDay: 1 },
  { label: 'Night', code: 0, isDay: 0 },
]

const PRESETS: ReadonlyArray<{ label: string; value: AtmosPreset }> = [
  { label: 'Off', value: 'none' },
  { label: 'Rain', value: 'rain' },
  { label: 'Snow', value: 'snow' },
  { label: 'Hail', value: 'hail' },
]

const Control = (props: { label: string; children: unknown }): JSX.Element => (
  <div class="space-y-1">
    <div class="text-[11px] font-semibold tracking-wide text-white/60 uppercase">
      {props.label}
    </div>
    {props.children}
  </div>
)

/** Dev route: explore the Three.js sky + atmos-fx precipitation in isolation. */
export default function Playground(): JSX.Element {
  const [condIdx, setCondIdx] = createSignal(0)
  const [showSky, setShowSky] = createSignal(true)
  const [preset, setPreset] = createSignal<AtmosPreset>('rain')
  const [density, setDensity] = createSignal(0.6)
  const [wind, setWind] = createSignal(-0.12)
  const [rootEl, setRootEl] = createSignal<HTMLElement | undefined>(undefined)

  useAtmosphere(rootEl, preset, density, wind)
  const c = (): { code: number; isDay: number } => CONDITIONS[condIdx()]

  return (
    <div
      ref={(el) => setRootEl(el)}
      data-atmos-root
      class="relative min-h-screen overflow-hidden"
    >
      <Show when={showSky()}>
        <Sky3D code={c().code} isDay={c().isDay} />
      </Show>

      {/* glass / collision surfaces for atmos-fx to land on */}
      <div class="relative z-10 mx-auto grid max-w-[472px] grid-cols-2 gap-3.5 p-4 pt-[15vh]">
        <div
          data-atmos-glass
          data-atmos-collision
          class="rounded-[26px] bg-white/12 p-4 backdrop-blur-2xl"
        >
          <p class="text-2xl font-light">Glass card</p>
          <p class="text-sm text-white/70">rain lands here and drips</p>
        </div>
        <div
          data-atmos-glass
          data-atmos-collision
          class="rounded-[26px] bg-white/12 p-4 backdrop-blur-2xl"
        >
          <p class="text-2xl font-light">Collision</p>
          <p class="text-sm text-white/70">splash from the top edge</p>
        </div>
        <div
          data-atmos-glass
          data-atmos-collision
          class="col-span-2 rounded-[26px] bg-white/12 p-4 backdrop-blur-2xl"
        >
          <p class="text-lg font-light">Wide glass surface</p>
          <p class="text-sm text-white/70">gathers water, drips down</p>
        </div>
      </div>

      {/* control panel */}
      <div class="fixed inset-x-0 bottom-0 z-50 space-y-3 border-t border-white/10 bg-black/60 p-4 backdrop-blur-xl">
        <Control label="Sky">
          <div class="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setShowSky((v) => !v)}
              class={`rounded-full px-3 py-1 text-sm ${showSky() ? 'bg-white/25 text-white' : 'bg-white/10 text-white/60'}`}
            >
              Three.js sky {showSky() ? 'on' : 'off'}
            </button>
            <For each={CONDITIONS}>
              {(cnd, i) => (
                <button
                  type="button"
                  onClick={() => setCondIdx(i())}
                  class={`rounded-full px-3 py-1 text-sm ${condIdx() === i() ? 'bg-white/25 text-white' : 'bg-white/10 text-white/70'}`}
                >
                  {cnd.label}
                </button>
              )}
            </For>
          </div>
        </Control>

        <Control label="Precipitation (atmos-fx)">
          <div class="flex flex-wrap gap-1.5">
            <For each={PRESETS}>
              {(p) => (
                <button
                  type="button"
                  onClick={() => setPreset(p.value)}
                  class={`rounded-full px-3 py-1 text-sm ${preset() === p.value ? 'bg-accent-amber/80 text-white' : 'bg-white/10 text-white/70'}`}
                >
                  {p.label}
                </button>
              )}
            </For>
          </div>
          <div class="space-y-1 pt-2">
            <div class="flex justify-between text-xs text-white/70">
              <span>density {density().toFixed(2)}</span>
              <span>wind {wind().toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={density()}
              onInput={(e) => setDensity(Number(e.currentTarget.value))}
              class="w-full"
            />
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.01"
              value={wind()}
              onInput={(e) => setWind(Number(e.currentTarget.value))}
              class="w-full"
            />
          </div>
        </Control>
      </div>
    </div>
  )
}
