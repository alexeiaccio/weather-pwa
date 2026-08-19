import { Schema } from 'effect'

/**
 * Weather data shapes from the Open-Meteo forecast API (W1 contract).
 * `OpenMeteoForecast` mirrors the JSON response; `Forecast` is the trimmed,
 * denormalized domain shape the UI consumes.
 */

export const CurrentSchema = Schema.Struct({
  time: Schema.String,
  temperature_2m: Schema.Number,
  apparent_temperature: Schema.Number,
  weather_code: Schema.Number,
  is_day: Schema.Number,
  relative_humidity_2m: Schema.Number,
  wind_speed_10m: Schema.Number,
  pressure_msl: Schema.Number,
})

export const HourlySchema = Schema.Struct({
  time: Schema.Array(Schema.String),
  temperature_2m: Schema.Array(Schema.Number),
  precipitation_probability: Schema.Array(Schema.Number),
})

export const DailySchema = Schema.Struct({
  time: Schema.Array(Schema.String),
  weather_code: Schema.Array(Schema.Number),
  temperature_2m_max: Schema.Array(Schema.Number),
  temperature_2m_min: Schema.Array(Schema.Number),
  precipitation_probability_max: Schema.Array(Schema.Number),
})

export const OpenMeteoForecast = Schema.Struct({
  latitude: Schema.Number,
  longitude: Schema.Number,
  timezone: Schema.String,
  current: CurrentSchema,
  hourly: HourlySchema,
  daily: DailySchema,
})

export type OpenMeteoForecast = Schema.Schema.Type<typeof OpenMeteoForecast>

/** The hourly slice the MVP curve shows: the next `HOURS` hours. */
export const HOURLY_HOURS = 24 as const

export const Forecast = Schema.Struct({
  placeKey: Schema.String,
  fetchedAt: Schema.Number,
  current: Schema.Struct({
    temp: Schema.Number,
    feels: Schema.Number,
    code: Schema.Number,
    isDay: Schema.Number,
    humidity: Schema.Number,
    windKmh: Schema.Number,
    pressureHpa: Schema.Number,
  }),
  hourly: Schema.Array(
    Schema.Struct({
      time: Schema.String,
      temp: Schema.Number,
      precipProb: Schema.Number,
    }),
  ),
  daily: Schema.Array(
    Schema.Struct({
      date: Schema.String,
      code: Schema.Number,
      max: Schema.Number,
      min: Schema.Number,
      precipProbMax: Schema.Number,
    }),
  ),
})

export type Forecast = Schema.Schema.Type<typeof Forecast>

/**
 * Convert a raw Open-Meteo payload into the trimmed `Forecast`. Hourly is
 * sliced to the next 24 hours (the MVP curve window).
 */
export const toForecast = (
  raw: OpenMeteoForecast,
  placeKey: string,
  fetchedAt: number,
): Forecast => {
  const hours = Math.min(raw.hourly.time.length, HOURLY_HOURS)
  return {
    placeKey,
    fetchedAt,
    current: {
      temp: raw.current.temperature_2m,
      feels: raw.current.apparent_temperature,
      code: raw.current.weather_code,
      isDay: raw.current.is_day,
      humidity: raw.current.relative_humidity_2m,
      windKmh: raw.current.wind_speed_10m,
      pressureHpa: raw.current.pressure_msl,
    },
    hourly: Array.from({ length: hours }, (_, i) => ({
      time: raw.hourly.time[i],
      temp: raw.hourly.temperature_2m[i],
      precipProb: raw.hourly.precipitation_probability[i],
    })),
    daily: raw.daily.time.map((date, i) => ({
      date,
      code: raw.daily.weather_code[i],
      max: raw.daily.temperature_2m_max[i],
      min: raw.daily.temperature_2m_min[i],
      precipProbMax: raw.daily.precipitation_probability_max[i],
    })),
  }
}
