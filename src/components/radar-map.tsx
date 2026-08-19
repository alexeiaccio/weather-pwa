import { createEffect, createSignal, onCleanup, Show, For } from 'solid-js'
import type { JSX } from '@solidjs/web'
import {
  TILE_SIZE,
  fetchRadar,
  latToPx,
  lonToPx,
  osmTile,
  radarTile,
} from '../lib/radar/rainviewer.ts'
import type { RvFrame, RvMetadata } from '../lib/radar/rainviewer.ts'

interface Size {
  readonly w: number
  readonly h: number
}

interface TilePos {
  readonly x: number
  readonly y: number
  readonly left: number
  readonly top: number
}

const ZOOM = 9
const FRAME_MS = 800

const tileGrid = (cx: number, cy: number, size: Size): TilePos[] => {
  const x0 = Math.floor((cx - size.w / 2) / TILE_SIZE)
  const x1 = Math.floor((cx + size.w / 2) / TILE_SIZE)
  const y0 = Math.floor((cy - size.h / 2) / TILE_SIZE)
  const y1 = Math.floor((cy + size.h / 2) / TILE_SIZE)
  const base = {
    left: x0 * TILE_SIZE - (cx - size.w / 2),
    top: y0 * TILE_SIZE - (cy - size.h / 2),
  }
  const tiles: TilePos[] = []
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      tiles.push({
        x,
        y,
        left: base.left + (x - x0) * TILE_SIZE,
        top: base.top + (y - y0) * TILE_SIZE,
      })
    }
  }
  return tiles
}

/**
 * Animated precipitation radar (RainViewer, keyless) centered on a place:
 * OpenStreetMap base + the active radar frame as a transparent overlay.
 */
export const RadarMap = (props: {
  readonly lat: number
  readonly lon: number
}): JSX.Element => {
  const [size, setSize] = createSignal<Size>({ w: 400, h: 240 })
  const [meta, setMeta] = createSignal<RvMetadata | null>(null)
  const [error, setError] = createSignal(false)
  const [fi, setFi] = createSignal(0)
  const [playing, setPlaying] = createSignal(true)
  let ref: HTMLDivElement | null = null

  // Measure the viewport once mounted.
  createEffect(
    () => ref,
    () => {
      if (ref)
        setSize({ w: ref.clientWidth || 400, h: ref.clientHeight || 240 })
    },
  )

  // Fetch radar metadata once.
  createEffect(
    () => `${props.lat},${props.lon}`,
    () => {
      setMeta(null)
      setError(false)
      void fetchRadar()
        .then((m) => setMeta(m))
        .catch(() => setError(true))
    },
  )

  const frames = (): readonly RvFrame[] => meta()?.frames ?? []
  const activePath = (): string | undefined =>
    frames()[fi() % Math.max(1, frames().length)]?.path

  // Animate frames while playing.
  createEffect(() => {
    if (!playing() || frames().length <= 1) return
    const t = setInterval(
      () => setFi((i) => (i + 1) % Math.max(1, frames().length)),
      FRAME_MS,
    )
    onCleanup(() => clearInterval(t))
  })

  const centerPx = () => ({
    x: lonToPx(props.lon, ZOOM),
    y: latToPx(props.lat, ZOOM),
  })
  const baseTiles = () =>
    tileGrid(centerPx().x, centerPx().y, { w: size().w, h: size().h })
  const overlayTiles = () => baseTiles()

  return (
    <div
      class="relative w-full overflow-hidden rounded-2xl bg-sky-night"
      ref={(el) => (ref = el)}
      style={{ height: '240px' }}
    >
      {/* base map */}
      <For each={baseTiles()}>
        {(t) => (
          <img
            src={osmTile(ZOOM, t.x, t.y)}
            alt=""
            loading="lazy"
            draggable={false}
            class="pointer-events-none absolute"
            style={{
              left: `${t.left}px`,
              top: `${t.top}px`,
              width: `${TILE_SIZE}px`,
              height: `${TILE_SIZE}px`,
            }}
          />
        )}
      </For>
      {/* radar overlay for the active frame */}
      <Show when={meta() && activePath()}>
        <For each={overlayTiles()}>
          {(t) => (
            <img
              src={radarTile(meta()!.host, activePath()!, ZOOM, t.x, t.y)}
              alt=""
              loading="lazy"
              draggable={false}
              class="pointer-events-none absolute opacity-70"
              style={{
                left: `${t.left}px`,
                top: `${t.top}px`,
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE}px`,
              }}
            />
          )}
        </For>
      </Show>

      {/* status / controls / attribution */}
      <div class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-[11px] text-white/90">
        <Show
          when={!error() && frames().length > 0}
          fallback={
            <span>{error() ? 'Radar unavailable' : 'Loading radar…'}</span>
          }
        >
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            class="rounded-full bg-white/20 px-2.5 py-0.5 font-semibold"
          >
            {playing() ? '❚❚' : '▶'}
          </button>
          <span>
            {new Date(
              frames()[fi() % frames().length].time * 1000,
            ).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </Show>
        <span class="text-right leading-tight">
          © OpenStreetMap · Radar © RainViewer
        </span>
      </div>
    </div>
  )
}
