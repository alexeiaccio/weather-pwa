import { Layer, ManagedRuntime } from 'effect'
import type { Effect } from 'effect'
import { WeatherServiceLive } from './weather/api.ts'
import { GeocodingServiceLive } from './place/api.ts'

const AppLayer = Layer.merge(WeatherServiceLive, GeocodingServiceLive)

/** Singleton Effect runtime providing the app's data services (W7). */
export const Runtime = ManagedRuntime.make(AppLayer)

/** Run an Effect that depends on the app services, returning a Promise. */
export const run = <A, E>(effect: Effect.Effect<A, E, never>): Promise<A> =>
  Runtime.runPromise(effect)
