import { createSignal, For } from 'solid-js'
import type { JSX } from '@solidjs/web'
import { useAtmosphere } from '../lib/use-atmosphere.ts'
import type { AtmosPreset } from '../lib/atmos.ts'

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

/** Dev route: explore atmos-fx precipitation over the gradient sky. */
export default function Playground(): JSX.Element {
  const [preset, setPreset] = createSignal<AtmosPreset>('rain')
  const [density, setDensity] = createSignal(0.6)
  const [wind, setWind] = createSignal(-0.12)
  const [rootEl, setRootEl] = createSignal<HTMLElement | undefined>(undefined)

  useAtmosphere(rootEl, preset, density, wind)

  return (
    <div
      ref={(el) => setRootEl(el)}
      data-atmos-root
      class="relative min-h-screen overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #5b8fc0 0%, #4a7ba8 55%, #3c658f 100%)',
      }}
    >
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
