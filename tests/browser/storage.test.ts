import { beforeEach, describe, expect, test } from 'vitest'
import {
  readForecast,
  readPin,
  writeForecast,
  writePin,
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

const PLACE: Place = {
  id: 524901,
  name: 'Moscow',
  latitude: 55.7558,
  longitude: 37.6173,
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

describe('IndexedDB weather store (W7)', () => {
  beforeEach(clearDb)

  test('single pin roundtrips', async () => {
    expect(await run(readPin)).toBeNull()
    await run(writePin(PLACE))
    expect(await run(readPin)).toEqual(PLACE)
    // writing again overwrites the single pinned row
    await run(writePin({ ...PLACE, name: 'St Petersburg' }))
    expect((await run(readPin))?.name).toBe('St Petersburg')
  })

  test('forecast cache roundtrips per key', async () => {
    expect(
      await run(readForecast('55.7,37.6|2026-08-19|metric')),
    ).toBeUndefined()
    await run(writeForecast('55.7,37.6|2026-08-19|metric', FORECAST))
    expect(await run(readForecast('55.7,37.6|2026-08-19|metric'))).toEqual(
      FORECAST,
    )
    expect(await run(readForecast('other-key'))).toBeUndefined()
  })
})
