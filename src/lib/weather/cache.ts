/** Cache policy for the forecast payload (W1 TTLs, W6 SWR). */
export const CURRENT_TTL_MS = 10 * 60_000
export const HOURLY_TTL_MS = 60 * 60_000
export const DAILY_TTL_MS = 6 * 60 * 60_000

const pad = (n: number): string => String(n).padStart(2, '0')

/** Local date key `yyyy-mm-dd` for a timestamp (used in the cache key). */
export const dayKey = (ms: number): string => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Cache key for a forecast payload, keyed by place + day + unit locale so a
 * cold offline launch (and a place switch) reads the right cached copy.
 */
export const cacheKey = (
  placeKey: string,
  day: string,
  unit: string = 'metric',
): string => `${placeKey}|${day}|${unit}`

/** True when `fetchedAt` is older than the TTL relative to `now`. */
export const isStale = (
  fetchedAt: number,
  now: number,
  ttl: number = CURRENT_TTL_MS,
): boolean => now - fetchedAt > ttl
