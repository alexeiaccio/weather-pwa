import { createSignal, For, Show } from 'solid-js'
import type { JSX } from '@solidjs/web'
import type { Place } from '../lib/place/schema.ts'
import { placeString } from '../lib/place/store.ts'
import { PlaceSearch } from './place-search.tsx'

/**
 * City list (stretch goal): Current location plus saved places, with search-to-
 * add, remove, and selection. Renders as a left panel — a sheet on phones, a
 * sidebar on wide windows (W2).
 */
export const PlacesPanel = (props: {
  readonly open: boolean
  readonly places: readonly Place[]
  readonly selected: Place | null
  readonly onClose: () => void
  readonly onSelect: (id: number | null) => void
  readonly onRemove: (id: number) => void
  readonly onAdd: (place: Place) => void
}): JSX.Element => {
  const [adding, setAdding] = createSignal(false)
  const select = (place: Place | null): void => {
    props.onSelect(place ? place.id : null)
    props.onClose()
  }

  return (
    <Show when={props.open}>
      <>
        <div
          class="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={props.onClose}
        />
        <aside class="fixed inset-y-0 left-0 z-50 flex h-full w-[300px] max-w-[86vw] flex-col gap-3 overflow-y-auto border-r border-white/10 bg-sky-night/95 px-4 pt-4 pb-6 backdrop-blur-2xl">
          <div class="flex items-center justify-between pt-2">
            <h2 class="text-[17px] font-semibold">Weather</h2>
            <button
              type="button"
              onClick={props.onClose}
              class="tap rounded-full bg-white/15 px-3 text-[15px] text-white"
            >
              Done
            </button>
          </div>

          <button
            type="button"
            onClick={() => select(null)}
            class={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-[16px] text-white ${
              props.selected === null
                ? 'bg-white/20 font-medium'
                : 'hover:bg-white/10'
            }`}
          >
            📍 Current location
            <Show when={props.selected === null}>
              <span class="text-xs text-ink-3">active</span>
            </Show>
          </button>

          <For each={props.places}>
            {(place) => (
              <div
                class={`flex items-center gap-1 rounded-2xl text-white ${
                  props.selected?.id === place.id ? 'bg-white/20' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => select(place)}
                  class="tap flex-1 px-3 py-2.5 text-left text-[16px] font-medium hover:bg-white/10"
                >
                  {placeString(place)}
                  <Show when={props.selected?.id === place.id}>
                    <span class="ml-2 text-xs text-ink-3">active</span>
                  </Show>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${place.name}`}
                  onClick={() => props.onRemove(place.id)}
                  class="tap pr-3 text-ink-3 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}
          </For>

          <Show when={adding} fallback={null}>
            <div class="mt-1 rounded-2xl bg-white/5 p-3">
              <PlaceSearch
                onSelect={(place) => {
                  props.onAdd(place)
                  setAdding(false)
                  props.onClose()
                }}
              />
            </div>
          </Show>

          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            class="mt-auto tap rounded-full border border-white/20 px-4 py-2 text-[15px] font-medium text-white hover:bg-white/10"
          >
            {adding() ? 'Cancel' : '+ Add a city'}
          </button>
        </aside>
      </>
    </Show>
  )
}
