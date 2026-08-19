import { beforeEach, describe, expect, test } from 'vitest'
import {
  addPlace,
  listPlaces,
  readForecast,
  removePlace,
  selectedPlace,
  selectedId,
  selectPlace,
  writeForecast,
} from '../../src/lib/store/db'
import { run } from '../../src/lib/runtime'
import type { Place } from '../../src/lib/place/schema'
import type { Forecast } from '../../src/lib/weather/schema'

// The app's DB is shared with the smoke test on the one chromium instance, so
// drop it between cases.
const clearDb = (): Promise<void> =>
  new Promise((resolve) => {
    const req = indexedDB.deleteDatabase('weather')
    req.onsuccess = () => resolve()
    req.onerror = () => resolve()
    req.onblocked = () => resolve()
  })

const MOSCOW: Place = {
  id: 524901,
  name: 'Moscow',
  latitude: 55.7558,
  longitude: 37.6173,
  country: 'Russia',
  timezone: 'Europe/Moscow',
}
const SPB: Place = {
  id: 498817,
  name: 'St Petersburg',
  latitude: 59.9311,
  longitude: 30.3609,
  country: 'Russia',
  timezone: 'Europe/Moscow',
}

const FORECAST: Forecast = {
  placeKey: '55.7558,37.6173',
  fetchedAt: 0,
  current: {
    temp: 17.7,
    feels: 15.3,
    code: 3,
    isDay: 1,
    humidity: 58,
    windKmh: 15.1,
    pressureHpa: 1005.3,
  },
  hourly: [{ time: '2026-08-19T13:00', temp: 17.5, precipProb: 20 }],
  daily: [{ date: '2026-08-19', code: 3, max: 24, min: 8, precipProbMax: 40 }],
}

describe('IndexedDB weather store (W7) — saved cities', () => {
  beforeEach(clearDb)

  test('saved places list grows in add order and selects the new one', async () => {
    expect(await run(listPlaces())).toEqual([])
    expect(await run(selectedId())).toBeNull()

    await run(addPlace(MOSCOW))
    await run(addPlace(SPB))

    const places = await run(listPlaces())
    expect(places.map((p) => p.name)).toEqual(['Moscow', 'St Petersburg'])
    expect(await run(selectedId())).toBe(SPB.id)
    expect((await run(selectedPlace()))?.name).toBe('St Petersburg')
  })

  test('selection can move between Current location and a saved place', async () => {
    await run(addPlace(MOSCOW))
    await run(addPlace(SPB))

    await run(selectPlace(MOSCOW.id))
    expect((await run(selectedPlace()))?.name).toBe('Moscow')

    // null = Current location (geolocation)
    await run(selectPlace(null))
    expect(await run(selectedId())).toBeNull()
    expect(await run(selectedPlace())).toBeUndefined()
  })

  test('remove deletes a place and its selection', async () => {
    await run(addPlace(MOSCOW))
    await run(addPlace(SPB))
    await run(removePlace(MOSCOW.id))
    expect((await run(listPlaces())).map((p) => p.name)).toEqual([
      'St Petersburg',
    ])
  })
})

describe('IndexedDB forecast cache (unchanged)', () => {
  beforeEach(clearDb)

  test('roundtrips per key', async () => {
    expect(await run(readForecast('a|b|c'))).toBeUndefined()
    await run(writeForecast('a|b|c', FORECAST))
    expect(await run(readForecast('a|b|c'))).toEqual(FORECAST)
    expect(await run(readForecast('other-key'))).toBeUndefined()
  })
})
