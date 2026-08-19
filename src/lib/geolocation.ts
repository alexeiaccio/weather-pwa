import type { GeoPosition } from './place/store.ts'

const geoAvailable = (): boolean => 'geolocation' in globalThis.navigator

/** Resolve the device position via the Geolocation API (W3 bootstrap). */
export const getPosition = (): Promise<GeoPosition> =>
  new Promise((resolve) => {
    if (!geoAvailable()) {
      resolve({ ok: false, latitude: 0, longitude: 0 })
      return
    }
    globalThis.navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          ok: true,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve({ ok: false, latitude: 0, longitude: 0 }),
      { timeout: 8_000, maximumAge: 300_000 },
    )
  })
