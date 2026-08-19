import type { Place } from './schema.ts'

/** What the app shows for its place at a given moment (W3). */
export type Bootstrap =
  | { readonly kind: 'pin'; readonly place: Place }
  | {
      readonly kind: 'current'
      readonly name: 'Current location'
      readonly latitude: number
      readonly longitude: number
    }
  | { readonly kind: 'search' }

export interface GeoPosition {
  readonly ok: boolean
  readonly latitude: number
  readonly longitude: number
}

/**
 * W3 bootstrap rule: a pinned Place always wins; otherwise geolocation's
 * current location; otherwise fall through to the search empty state.
 */
export const resolveBootstrap = (
  pin: Place | null,
  geo: GeoPosition,
): Bootstrap => {
  if (pin) return { kind: 'pin', place: pin }
  if (geo.ok) {
    return {
      kind: 'current',
      name: 'Current location',
      latitude: geo.latitude,
      longitude: geo.longitude,
    }
  }
  return { kind: 'search' }
}

/** Display name for a pin (falls back to raw coords). */
export const placeString = (place: Place): string =>
  place.name + (place.country ? `, ${place.country}` : '')
