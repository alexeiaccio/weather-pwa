import { describe, expect, test } from 'vitest'
import {
  TILE_SIZE,
  latToPx,
  lonToPx,
  osmTile,
  radarTile,
} from '../../src/lib/radar/rainviewer'

describe('Web-Mercator tile math', () => {
  test('lonToPx is 0 at lon 180 and grows with zoom', () => {
    expect(lonToPx(180, 1)).toBeCloseTo(TILE_SIZE * 2, 6) // (180+180)/360*2*256
    expect(lonToPx(-180, 1)).toBeCloseTo(0, 6)
    expect(lonToPx(0, 2)).toBeCloseTo((180 / 360) * 4 * TILE_SIZE, 6)
  })

  test('latToPx maps the equator to mid-height and north above it', () => {
    expect(latToPx(0, 1)).toBeCloseTo(TILE_SIZE, 6)
    expect(latToPx(60, 1)).toBeLessThan(TILE_SIZE)
    expect(latToPx(60, 1)).toBeGreaterThan(0)
  })
})

describe('tile URL builders', () => {
  test('radarTile composes host + path + z/x/y + radar suffix', () => {
    expect(radarTile('https://x.example', '/v2/123', 9, 256, 128)).toBe(
      'https://x.example/v2/123/9/256/128/0/0_0.png',
    )
  })

  test('osmTile uses the z/x/y path', () => {
    expect(osmTile(9, 256, 128)).toBe(
      'https://tile.openstreetmap.org/9/256/128.png',
    )
  })
})
