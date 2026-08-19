import { Schema } from 'effect'

/**
 * A named, pinned location picked through geocoding search (W3). A Place
 * always carries a display name; it never comes from raw coordinates.
 */
export const Place = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  latitude: Schema.Number,
  longitude: Schema.Number,
  admin1: Schema.optional(Schema.String),
  country: Schema.optional(Schema.String),
  timezone: Schema.optional(Schema.String),
})

export type Place = Schema.Schema.Type<typeof Place>

/** One candidate from the Open-Meteo geocoding search response. */
export const GeocodingResult = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  latitude: Schema.Number,
  longitude: Schema.Number,
  admin1: Schema.optional(Schema.String),
  country: Schema.optional(Schema.String),
  timezone: Schema.optional(Schema.String),
  population: Schema.optional(Schema.Number),
})

export const GeocodingResponse = Schema.Struct({
  results: Schema.optional(Schema.Array(GeocodingResult)),
})

export type GeocodingResponse = Schema.Schema.Type<typeof GeocodingResponse>
export type GeocodingResultRow = Schema.Schema.Type<typeof GeocodingResult>
