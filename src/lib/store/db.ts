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
const PLACES_STORE_V1 = 'places'
const FORECAST_STORE = 'forecast_cache'
const SAVED_STORE = 'saved_places'
const SELECTION_STORE = 'selection'

/**
 * v1 storage: a single pinned Place plus a forecast cache (W3/W7). v2 extends
 * it to a saved-places list (the city-list stretch goal) with an active
 * selection; the v1 pinned place becomes the first saved place.
 */
const PinRowV1 = Schema.Struct({ key: Schema.Literal('pinned'), place: Place })
const ForecastRow = Schema.Struct({ key: Schema.String, forecast: Forecast })

const SavedPlaceRow = Schema.Struct({
  key: Schema.String, // String(place.id)
  place: Place,
  order: Schema.Int,
})
const SelectionRow = Schema.Struct({
  key: Schema.Literal('selection'),
  id: Schema.optional(Schema.Number),
})

const PlacesTableV1 = IndexedDbTable.make({
  name: PLACES_STORE_V1,
  schema: PinRowV1,
  keyPath: 'key',
})
const ForecastTable = IndexedDbTable.make({
  name: FORECAST_STORE,
  schema: ForecastRow,
  keyPath: 'key',
})

const SavedPlacesTable = IndexedDbTable.make({
  name: SAVED_STORE,
  schema: SavedPlaceRow,
  keyPath: 'key',
})
const SelectionTable = IndexedDbTable.make({
  name: SELECTION_STORE,
  schema: SelectionRow,
  keyPath: 'key',
})

const V1 = IndexedDbVersion.make(PlacesTableV1, ForecastTable)
const V2 = IndexedDbVersion.make(
  PlacesTableV1, // kept (unused going forward) so the migration can read it
  ForecastTable,
  SavedPlacesTable,
  SelectionTable,
)

const WeatherDb = IndexedDbDatabase.make(
  V1,
  Effect.fn('weather.storage.v1')(function* (api): Effect.fn.Return<
    void,
    IndexedDbDatabase.IndexedDbDatabaseError
  > {
    yield* api.createObjectStore(PLACES_STORE_V1)
    yield* api.createObjectStore(FORECAST_STORE)
  }),
).add(
  V2,
  // oxlint-disable-next-line effecttsgo/suspend
  Effect.fn('weather.storage.v2SavedPlaces')(function* (
    from: IndexedDbDatabase.Transaction<any>,
    to: IndexedDbDatabase.Transaction<any>,
  ): Effect.fn.Return<
    void,
    | IndexedDbQueryBuilder.IndexedDbQueryError
    | IndexedDbDatabase.IndexedDbDatabaseError
  > {
    yield* to.createObjectStore(SAVED_STORE)
    yield* to.createObjectStore(SELECTION_STORE)
    const fromAny = from as any
    // Migration reads/writes cross a schema boundary, so the dynamic transaction
    // is deliberately untyped here.
    const pins = yield* fromAny.from(PLACES_STORE_V1).select().equals('pinned')
    const pin = pins[0]?.place
    if (pin) {
      const toAny = to as any
      yield* toAny
        .from(SAVED_STORE)
        .upsert({ key: String(pin.id), place: pin, order: 0 })
      yield* toAny
        .from(SELECTION_STORE)
        .upsert({ key: 'selection', id: pin.id })
    }
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
    // local: true — one connection per operation (browser tests drop the DB).
    // oxlint-disable-next-line effecttsgo/strict-effect-provide
    Effect.provide(WeatherDbLayer, { local: true }),
  )

type StorageError =
  | IndexedDbQueryBuilder.IndexedDbQueryError
  | IndexedDbDatabase.IndexedDbDatabaseError

// --- forecast cache (unchanged) ---

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

// --- saved places + selection (city list) ---

/** All saved places, ordered by the order they were added. */
export const listPlaces = (): Effect.Effect<Place[], StorageError> =>
  withDb((qb) => qb.from(SAVED_STORE).select()).pipe(
    Effect.map((rows) =>
      [...rows].sort((a, b) => a.order - b.order).map((r) => r.place),
    ),
  )

export const getPlace = (
  id: number,
): Effect.Effect<Place | undefined, StorageError> =>
  withDb((qb) => qb.from(SAVED_STORE).select().equals(String(id))).pipe(
    Effect.map((rows) => rows[0]?.place),
  )

export const addPlace = (place: Place): Effect.Effect<void, StorageError> =>
  Effect.gen(function* () {
    const count = yield* withDb((qb) => qb.from(SAVED_STORE).count())
    yield* withDb((qb) =>
      qb
        .from(SAVED_STORE)
        .upsert({ key: String(place.id), place, order: count }),
    )
    yield* selectPlace(place.id)
  })

export const removePlace = (id: number): Effect.Effect<void, StorageError> =>
  withDb((qb) => qb.from(SAVED_STORE).delete().equals(String(id)))

/** Rewrite the saved-places order (list order == the given array order). */
export const reorderPlaces = (
  places: readonly Place[],
): Effect.Effect<void, StorageError> =>
  withDb((qb) =>
    qb.from(SAVED_STORE).upsertAll(
      places.map((place, order) => ({
        key: String(place.id),
        place,
        order,
      })),
    ),
  )

/** The active saved-place id, or null when "Current location" is active. */
export const selectedId = (): Effect.Effect<number | null, StorageError> =>
  withDb((qb) => qb.from(SELECTION_STORE).select().equals('selection')).pipe(
    Effect.map((rows) => rows[0]?.id ?? null),
  )

/** The active saved Place, or undefined when none is selected. */
export const selectedPlace = (): Effect.Effect<
  Place | undefined,
  StorageError
> =>
  selectedId().pipe(
    Effect.flatMap((id) =>
      id === null ? Effect.succeed(undefined) : getPlace(id),
    ),
  )

export const selectPlace = (
  id: number | null,
): Effect.Effect<void, StorageError> =>
  withDb((qb) =>
    qb.from(SELECTION_STORE).upsert({ key: 'selection', id: id ?? undefined }),
  )
