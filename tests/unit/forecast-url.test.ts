import { describe, expect, test } from 'vitest'
import { buildForecastUrl } from '../../src/lib/weather/api'

describe('buildForecastUrl', () => {
  test('encodes coordinate + the current/hourly/daily params in one GET', () => {
    const url = buildForecastUrl(55.75, 37.62)
    const u = new URL(url)
    expect(u.origin).toBe('https://api.open-meteo.com')
    expect(u.pathname).toBe('/v1/forecast')
    expect(u.searchParams.get('latitude')).toBe('55.75')
    expect(u.searchParams.get('longitude')).toBe('37.62')
    expect(u.searchParams.get('current')).toContain('temperature_2m')
    expect(u.searchParams.get('current')).toContain('pressure_msl')
    expect(u.searchParams.get('hourly')).toContain('precipitation_probability')
    expect(u.searchParams.get('daily')).toContain(
      'precipitation_probability_max',
    )
    expect(u.searchParams.get('forecast_days')).toBe('10')
    expect(u.searchParams.get('timezone')).toBe('auto')
  })
})
