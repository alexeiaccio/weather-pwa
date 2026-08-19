import { Context, Duration, Effect, Layer, Schema } from 'effect'
import { Forecast, OpenMeteoForecast, toForecast } from './schema.ts'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const FETCH_TIMEOUT = Duration.millis(10_000)

/** Build the one-GET Open-Meteo URL for a coordinate (metric units, W1). */
export const buildForecastUrl = (
  latitude: number,
  longitude: number,
): string => {
  const q = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      'temperature_2m,apparent_temperature,weather_code,is_day,relative_humidity_2m,wind_speed_10m,pressure_msl',
    hourly: 'temperature_2m,precipitation_probability',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: '10',
    timezone: 'auto',
  })
  return `${FORECAST_URL}?${q.toString()}`
}

export class ForecastTimeoutError extends Schema.TaggedError<ForecastTimeoutError>()(
  'ForecastTimeoutError',
  {},
) {}

export class ForecastNetworkError extends Schema.TaggedError<ForecastNetworkError>()(
  'ForecastNetworkError',
  { message: Schema.optional(Schema.String) },
) {}

export class ForecastHttpError extends Schema.TaggedError<ForecastHttpError>()(
  'ForecastHttpError',
  { status: Schema.Int },
) {}

export class ForecastDecodeError extends Schema.TaggedError<ForecastDecodeError>()(
  'ForecastDecodeError',
  { detail: Schema.optional(Schema.String) },
) {}

export type WeatherError =
  | ForecastTimeoutError
  | ForecastNetworkError
  | ForecastHttpError
  | ForecastDecodeError

/** Fetch + check + parse + trim in one Effect with a normalized error. */
export const fetchForecast = (
  latitude: number,
  longitude: number,
): Effect.Effect<Forecast, WeatherError> =>
  Effect.tryPromise({
    try: async (): Promise<Forecast> => {
      const res = await globalThis.fetch(buildForecastUrl(latitude, longitude))
      if (!res.ok) throw new ForecastHttpError({ status: res.status })
      const json: unknown = await res.json()
      let parsed: OpenMeteoForecast
      try {
        parsed = Schema.decodeUnknownSync(OpenMeteoForecast)(json)
      } catch (cause) {
        throw new ForecastDecodeError({ detail: String(cause) })
      }
      return toForecast(
        parsed,
        `${parsed.latitude},${parsed.longitude}`,
        Date.now(),
      )
    },
    catch: (cause) =>
      cause instanceof ForecastHttpError || cause instanceof ForecastDecodeError
        ? cause
        : new ForecastNetworkError({ message: String(cause) }),
  }).pipe(
    Effect.timeout(FETCH_TIMEOUT),
    Effect.mapError((e) =>
      e._tag === 'TimeoutError' ? new ForecastTimeoutError() : e,
    ),
  )

interface WeatherService {
  readonly fetchForecast: (
    latitude: number,
    longitude: number,
  ) => Effect.Effect<Forecast, WeatherError>
}

/** Named after the Spectre service pattern (`Context.Service`). */
const WeatherService = Context.Service<WeatherService>('WeatherService')

export const WeatherServiceLive = Layer.succeed(WeatherService, {
  fetchForecast,
})

export { WeatherService }
