import { describe, expect, test } from 'vitest'
import {
  cacheKey,
  dayKey,
  isStale,
  CURRENT_TTL_MS,
} from '../../src/lib/weather/cache'

describe('forecast cache policy', () => {
  test('dayKey is a local yyyy-mm-dd', () => {
    expect(dayKey(new Date(2026, 7, 19, 15, 30).getTime())).toBe('2026-08-19')
  })

  test('cacheKey ties place + day + unit locale', () => {
    expect(cacheKey('55,37', '2026-08-19')).toBe('55,37|2026-08-19|metric')
    expect(cacheKey('55,37', '2026-08-19', 'imperial')).not.toBe(
      cacheKey('55,37', '2026-08-19', 'metric'),
    )
  })

  test('isStale flips once the TTL elapses', () => {
    const now = 10 * 60_000
    expect(isStale(0, now - 1, CURRENT_TTL_MS)).toBe(false)
    expect(isStale(0, now + 1, CURRENT_TTL_MS)).toBe(true)
  })
})
