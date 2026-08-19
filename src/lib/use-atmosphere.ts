import { createEffect, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'
import type { AtmosPreset } from './atmos.ts'

/** Structural view of the atmos-fx controller we use (kept framework-free). */
interface AtmosphereController {
  readonly start: () => void
  readonly update: (options: object) => void
  readonly destroy: () => void
}

interface AtmosphereOptions {
  readonly density?: number
  readonly wind?: number
}

type Loaded = {
  createAtmosphere: (el: HTMLElement, options: object) => AtmosphereController
}

/**
 * Attach atmos-fx's framework-agnostic `createAtmosphere` to the given root
 * element (the forecast screen). The library is **code-split**: it (and the
 * React peer it bundles) is dynamic-imported only when a forecast with
 * precipitation mounts, keeping it off the critical path. Children tagged
 * `data-atmos-glass` / `data-atmos-collision` become glass/collision surfaces.
 * `preset === 'none'` zeroes density so no particles render.
 */
export const useAtmosphere = (
  root: Accessor<HTMLElement | undefined>,
  preset: () => AtmosPreset,
  opts: AtmosphereOptions = {},
): void => {
  let controller: AtmosphereController | undefined
  let cancelled = false

  const active = (): 'rain' | 'snow' | 'hail' => {
    const p = preset()
    return p === 'none' ? 'rain' : p
  }
  const density = (): number =>
    preset() === 'none' ? 0 : (opts.density ?? 0.7)
  const wind = (): number => opts.wind ?? -0.12

  createEffect(
    () => root() && !controller,
    () => {
      const el = root()
      if (el && !controller && !cancelled) {
        void import('atmos-fx')
          .then((mod: unknown) => mod as Loaded)
          .then(({ createAtmosphere }) => {
            if (cancelled || !el.isConnected) return
            controller = createAtmosphere(el, {
              preset: active(),
              density: density(),
              wind: wind(),
              quality: 'auto',
            })
            controller.start()
          })
          .catch(() => undefined) // precipitation is best-effort
      }
    },
  )

  createEffect(
    () => `${preset()}:${density()}:${wind()}`,
    () =>
      controller?.update({
        preset: active(),
        density: density(),
        wind: wind(),
      }),
  )

  onCleanup(() => {
    cancelled = true
    controller?.destroy()
    controller = undefined
  })
}
