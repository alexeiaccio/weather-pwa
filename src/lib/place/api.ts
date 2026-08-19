import { Context, Duration, Effect, Layer, Schema } from 'effect'
import { GeocodingResponse, Place } from './schema.ts'
import type { GeocodingResultRow } from './schema.ts'

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const SEARCH_TIMEOUT = Duration.millis(6_000)

export const buildSearchUrl = (query: string, limit = 8): string => {
  const q = new URLSearchParams({
    name: query,
    count: String(limit),
    language: 'en',
  })
  return `${GEOCODING_URL}?${q.toString()}`
}

export class SearchTimeoutError extends Schema.TaggedError<SearchTimeoutError>()(
  'SearchTimeoutError',
  {},
) {}

export class SearchNetworkError extends Schema.TaggedError<SearchNetworkError>()(
  'SearchNetworkError',
  { message: Schema.optional(Schema.String) },
) {}

export class SearchHttpError extends Schema.TaggedError<SearchHttpError>()(
  'SearchHttpError',
  { status: Schema.Int },
) {}

export class SearchDecodeError extends Schema.TaggedError<SearchDecodeError>()(
  'SearchDecodeError',
  { detail: Schema.optional(Schema.String) },
) {}

export type SearchError =
  | SearchTimeoutError
  | SearchNetworkError
  | SearchHttpError
  | SearchDecodeError

const toPlace = (raw: GeocodingResultRow): Place => ({
  id: raw.id,
  name: raw.name,
  latitude: raw.latitude,
  longitude: raw.longitude,
  admin1: raw.admin1,
  country: raw.country,
  timezone: raw.timezone,
})

/** Geocode a query → candidate Places in one Effect with a normalized error. */
export const searchPlaces = (
  query: string,
): Effect.Effect<Place[], SearchError> =>
  Effect.tryPromise({
    try: async (): Promise<Place[]> => {
      const res = await globalThis.fetch(buildSearchUrl(query))
      if (!res.ok) throw new SearchHttpError({ status: res.status })
      const json: unknown = await res.json()
      let parsed: GeocodingResponse
      try {
        parsed = Schema.decodeUnknownSync(GeocodingResponse)(json)
      } catch (cause) {
        throw new SearchDecodeError({ detail: String(cause) })
      }
      return (parsed.results ?? []).map((r) => toPlace(r))
    },
    catch: (cause) =>
      cause instanceof SearchHttpError || cause instanceof SearchDecodeError
        ? cause
        : new SearchNetworkError({ message: String(cause) }),
  }).pipe(
    Effect.timeout(SEARCH_TIMEOUT),
    Effect.mapError((e) =>
      e._tag === 'TimeoutError' ? new SearchTimeoutError() : e,
    ),
  )

interface GeocodingService {
  readonly search: (query: string) => Effect.Effect<Place[], SearchError>
}

const GeocodingService = Context.Service<GeocodingService>('GeocodingService')

export const GeocodingServiceLive = Layer.succeed(GeocodingService, {
  search: searchPlaces,
})

export { GeocodingService }
