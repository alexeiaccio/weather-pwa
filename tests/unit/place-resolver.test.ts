import { describe, expect, test } from 'vitest'
import { resolveBootstrap } from '../../src/lib/place/store'
import type { Place } from '../../src/lib/place/schema'

const PIN: Place = {
  id: 1,
  name: 'Moscow',
  latitude: 55.75,
  longitude: 37.62,
  country: 'Russia',
}

describe('resolveBootstrap (W3)', () => {
  test('a pinned place always wins, even if geolocation works', () => {
    expect(
      resolveBootstrap(PIN, { ok: true, latitude: 10, longitude: 20 }),
    ).toEqual({ kind: 'pin', place: PIN })
  })

  test('no pin + geolocation ok → current location with coords', () => {
    expect(
      resolveBootstrap(null, { ok: true, latitude: 59.9, longitude: 30.3 }),
    ).toEqual({
      kind: 'current',
      name: 'Current location',
      latitude: 59.9,
      longitude: 30.3,
    })
  })

  test('no pin + geolocation denied → search empty state', () => {
    expect(
      resolveBootstrap(null, { ok: false, latitude: 0, longitude: 0 }),
    ).toEqual({
      kind: 'search',
    })
  })
})
