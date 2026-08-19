/**
 * RainViewer radar client (W1 stretch goal, keyless). Provides the tile math
 * (Web Mercator) and the metadata fetch for the animated radar overlay.
 */

export const RAINVIEWER_INDEX =
  'https://api.rainviewer.com/public/weather-maps.json'
export const OSM_TILE = 'https://tile.openstreetmap.org'
export const TILE_SIZE = 256

export interface RvFrame {
  readonly time: number
  readonly path: string
}

export interface RvMetadata {
  readonly host: string
  readonly frames: ReadonlyArray<RvFrame>
}

const rad = (d: number): number => (d * Math.PI) / 180
const n = (z: number): number => Math.pow(2, z)

/** Web-Mercator horizontal pixel offset at zoom z (tile-space, 256px tiles). */
export const lonToPx = (lon: number, z: number): number =>
  ((lon + 180) / 360) * n(z) * TILE_SIZE

/** Web-Mercator vertical pixel offset at zoom z. */
export const latToPx = (lat: number, z: number): number =>
  ((1 - Math.asinh(Math.tan(rad(lat))) / Math.PI) / 2) * n(z) * TILE_SIZE

/** A radar frame tile URL for a given Web-Mercator x/y at zoom z. */
export const radarTile = (
  host: string,
  path: string,
  z: number,
  x: number,
  y: number,
): string => `${host}${path}/${z}/${x}/${y}/0/0_0.png`

/** An OpenStreetMap base tile URL (attribution required). */
export const osmTile = (z: number, x: number, y: number): string =>
  `${OSM_TILE}/${z}/${x}/${y}.png`

type FrameSet = {
  past?: ReadonlyArray<RvFrame>
  nowcast?: ReadonlyArray<RvFrame>
}

const parse = (json: unknown): RvMetadata => {
  const any = json as {
    host?: string
    radar?: FrameSet
  }
  const host =
    typeof any.host === 'string' ? any.host : 'https://tilecache.rainviewer.com'
  const src = any.radar ?? {}
  const frames = [...(src.past ?? [])]
    .map(normalize)
    .filter((f): f is RvFrame => f !== null)
    .slice(-8)
    .concat(
      (src.nowcast ?? [])
        .map(normalize)
        .filter((f): f is RvFrame => f !== null),
    )
  return { host, frames }
}

const normalize = (f: unknown): RvFrame | null => {
  const r = f as { time?: number; path?: string }
  if (typeof r?.time !== 'number' || typeof r?.path !== 'string') return null
  return { time: r.time, path: r.path }
}

/** Fetch the most recent past + nowcast radar frames. */
export const fetchRadar = async (): Promise<RvMetadata> => {
  const res = await globalThis.fetch(RAINVIEWER_INDEX)
  if (!res.ok) throw new Error(`rainviewer ${res.status}`)
  return parse(await res.json())
}
