import { createSignal, For, Show } from 'solid-js'
import type { JSX } from '@solidjs/web'
import { searchPlaces } from '../lib/place/api.ts'
import { run } from '../lib/runtime.ts'
import type { Place } from '../lib/place/schema.ts'

/** Search-to-pin box (W3): geocodes via Open-Meteo and reports the chosen Place. */
export const PlaceSearch = (props: {
  readonly onSelect: (place: Place) => void
}): JSX.Element => {
  const [query, setQuery] = createSignal('')
  const [results, setResults] = createSignal<Place[]>([])
  const [busy, setBusy] = createSignal(false)
  let debounce: ReturnType<typeof setTimeout> | undefined

  const onChange = (ev: InputEvent): void => {
    const q = (ev.currentTarget as HTMLInputElement).value
    setQuery(q)
    clearTimeout(debounce)
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    debounce = setTimeout(() => {
      setBusy(true)
      run(searchPlaces(q.trim()))
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setBusy(false))
    }, 250)
  }

  return (
    <div>
      <input
        type="search"
        placeholder="Search for a city…"
        value={query()}
        onInput={onChange}
        autocomplete="off"
        class="w-full rounded-2xl border border-white/15 bg-white/15 px-4 py-3 text-[17px] text-white backdrop-blur-md outline-none placeholder:text-ink-3"
      />
      <Show when={busy()}>
        <p class="mt-3 text-sm text-ink-2">Searching…</p>
      </Show>
      <div class="mt-2 overflow-hidden rounded-2xl">
        <For each={results()}>
          {(place) => (
            <button
              type="button"
              onClick={() => props.onSelect(place)}
              class="flex w-full items-center justify-between border-t border-white/10 bg-white/10 px-4 py-3 text-left text-[16px] text-white backdrop-blur-md last:border-b-0 hover:bg-white/20"
            >
              <span class="font-medium">
                {place.name}
                {place.admin1 ? `, ${place.admin1}` : ''}
              </span>
              <span class="text-sm text-ink-2">{place.country ?? ''}</span>
            </button>
          )}
        </For>
      </div>
      <p class="mt-4 text-sm text-ink-2">
        {query().trim().length >= 2 && results().length === 0 && !busy()
          ? 'No places found. Try another name.'
          : 'Pick a place to pin; it becomes the default on launch.'}
      </p>
    </div>
  )
}
