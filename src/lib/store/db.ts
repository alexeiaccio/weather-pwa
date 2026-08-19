import { Effect, Layer, Schema } from 'effect'
import {
  IndexedDb,
  IndexedDbDatabase,
  IndexedDbQueryBuilder,
  IndexedDbTable,
  IndexedDbVersion,
} from '@effect/platform-browser'
import { Place } from '../place/schema.ts'
import { Forecast } from '../weather/schema.ts'

const DB_NAME = 'weather'
const PLACES_STORE = 'places'
const FORECAST_STORE = 'forecast_cache'

/**
 * Single-pin persistence (W3/W7): one `places` row keyed `pinned`, plus a
 * forecast cache keyed by place+day+unit (W6/W7). Backed by app-owned
 * IndexedDB; the browser owns the data, the Worker is a static shell.
 */
const PlaceRow = Schema.Struct({ key: Schema.Literal('pinned'), place: Place })
const ForecastRow = Schema.Struct({ key: Schema.String, forecast: Forecast })

const PlacesTable = IndexedDbTable.make({
  name: PLACES_STORE,
  schema: PlaceRow,
  keyPath: 'key',
})
const ForecastTable = IndexedDbTable.make({
  name: FORECAST_STORE,
  schema: ForecastRow,
  keyPath: 'key',
})

const V1 = IndexedDbVersion.make(PlacesTable, ForecastTable)

const WeatherDb = IndexedDbDatabase.make(
  V1,
  Effect.fn('weather.storage.v1')(function* (api): Effect.fn.Return<
    void,
    IndexedDbDatabase.IndexedDbDatabaseError
  > {
    yield* api.createObjectStore(PLACES_STORE)
    yield* api.createObjectStore(FORECAST_STORE)
  }),
)

type QueryBuilder = Effect.Success<typeof WeatherDb.getQueryBuilder>

/** Opens `weather` from `window.indexedDB`; one connection per operation. */
const WeatherDbLayer = Layer.provide(
  WeatherDb.layer(DB_NAME),
  IndexedDb.layerWindow,
)

const withDb = <A, E>(
  use: (qb: QueryBuilder) => Effect.Effect<A, E>,
): Effect.Effect<
  A,
  | E
  | IndexedDbQueryBuilder.IndexedDbQueryError
  | IndexedDbDatabase.IndexedDbDatabaseError
> =>
  Effect.gen(function* () {
    const qb = yield* WeatherDb.getQueryBuilder
    return yield* use(qb)
  }).pipe(
    // local: true — one connection per operation (browser tests drop the DB
    // between cases).
    // oxlint-disable-next-line effecttsgo/strict-effect-provide
    Effect.provide(WeatherDbLayer, { local: true }),
  )

type StorageError =
  | IndexedDbQueryBuilder.IndexedDbQueryError
  | IndexedDbDatabase.IndexedDbDatabaseError

export const readPin: Effect.Effect<Place | null, StorageError> = withDb(
  (qb) => qb.from(PLACES_STORE).select().equals('pinned'),
).pipe(Effect.map((rows) => rows[0]?.place ?? null))

export const writePin = (
  place: Place,
): Effect.Effect<void, StorageError> =>
  withDb((qb) => qb.from(PLACES_STORE).upsert({ key: 'pinned', place }))

export const readForecast = (
  key: string,
): Effect.Effect<Forecast | undefined, StorageError> =>
  withDb((qb) => qb.from(FORECAST_STORE).select().equals(key)).pipe(
    Effect.map((rows) => rows[0]?.forecast),
  )

export const writeForecast = (
  key: string,
  forecast: Forecast,
): Effect.Effect<void, StorageError> =>
  withDb((qb) => qb.from(FORECAST_STORE).upsert({ key, forecast }))
