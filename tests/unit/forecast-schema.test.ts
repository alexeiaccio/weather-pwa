import { describe, expect, test } from 'vitest'
import {
  toForecast,
  HOURLY_HOURS,
  CurrentSchema,
} from '../../src/lib/weather/schema'
import { OpenMeteoForecast } from '../../src/lib/weather/schema'
import { Schema } from 'effect'

const rawValid = {
  latitude: 55.75,
  longitude: 37.62,
  timezone: 'Europe/Moscow',
  current: {
    time: '2026-08-19T13:45',
    temperature_2m: 17.7,
    apparent_temperature: 15.3,
    weather_code: 3,
    is_day: 1,
    relative_humidity_2m: 58,
    wind_speed_10m: 15.1,
    pressure_msl: 1005.3,
  },
  hourly: {
    time: ['2026-08-19T13:00', '2026-08-19T14:00'],
    temperature_2m: [17.5, 18.2],
    precipitation_probability: [20, 35],
  },
  daily: {
    time: ['2026-08-19'],
    weather_code: [3],
    temperature_2m_max: [24],
    temperature_2m_min: [8],
    precipitation_probability_max: [40],
  },
}

describe('OpenMeteoForecast schema', () => {
  test('decodes a valid payload', () => {
    const parsed = Schema.decodeUnknownSync(OpenMeteoForecast)(rawValid)
    expect(parsed.current.temperature_2m).toBe(17.7)
  })

  test('current temp is a finite number field', () => {
    expect(CurrentSchema.fields.temperature_2m?.ast).toBeDefined()
  })
})

describe('toForecast', () => {
  test('trims and denormalizes to the domain Forecast shape', () => {
    const f = toForecast(
      Schema.decodeUnknownSync(OpenMeteoForecast)(rawValid),
      '55.75,37.62',
      1234,
    )
    expect(f.placeKey).toBe('55.75,37.62')
    expect(f.fetchedAt).toBe(1234)
    expect(f.current.temp).toBe(17.7)
    expect(f.current.windKmh).toBe(15.1)
    expect(f.current.pressureHpa).toBe(1005.3)
    expect(f.hourly).toHaveLength(2)
    expect(f.hourly[0]).toEqual({
      time: '2026-08-19T13:00',
      temp: 17.5,
      precipProb: 20,
    })
    expect(f.daily[0]).toEqual({
      date: '2026-08-19',
      code: 3,
      max: 24,
      min: 8,
      precipProbMax: 40,
    })
  })

  test('slices hourly to HOURLY_HOURS even when the API returns more', () => {
    const many = {
      ...rawValid,
      hourly: {
        time: Array.from(
          { length: 200 },
          (_, i) => `2026-08-19T${String(i % 24).padStart(2, '0')}:00`,
        ),
        temperature_2m: Array.from({ length: 200 }, (_, i) => i),
        precipitation_probability: Array.from(
          { length: 200 },
          (_, i) => i % 100,
        ),
      },
    }
    const f = toForecast(
      Schema.decodeUnknownSync(OpenMeteoForecast)(many),
      'k',
      0,
    )
    expect(f.hourly).toHaveLength(HOURLY_HOURS)
  })
})
