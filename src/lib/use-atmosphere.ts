import { createEffect, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'
import type { AtmosPreset } from './atmos.ts'

/** Structural view of the atmos-fx controller we use (kept framework-free). */
interface AtmosphereController {
  readonly start: () => void
  readonly update: (options: object) => void
  readonly destroy: () => void
}

type Loaded = {
  createAtmosphere: (el: HTMLElement, options: object) => AtmosphereController
}

/**
 * Attach atmos-fx's framework-agnostic `createAtmosphere` to the given root
 * element. The library is code-split (dynamic import), so its size stays off the
 * critical path. Children tagged `data-atmos-glass` / `data-atmos-collision`
 * become glass/collision surfaces. `preset === 'none'` zeroes density.
 */
export const useAtmosphere = (
  root: Accessor<HTMLElement | undefined>,
  preset: Accessor<AtmosPreset>,
  density: Accessor<number> = () => 0.7,
  wind: Accessor<number> = () => -0.12,
): void => {
  let controller: AtmosphereController | undefined
  let cancelled = false

  const active = (): 'rain' | 'snow' | 'hail' => {
    const p = preset()
    return p === 'none' ? 'rain' : p
  }
  const effDensity = (): number => (preset() === 'none' ? 0 : density())
  const effWind = (): number => wind()

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
              density: effDensity(),
              wind: effWind(),
              quality: 'auto',
            })
            controller.start()
          })
          .catch(() => undefined) // precipitation is best-effort
      }
    },
  )

  createEffect(
    () => `${preset()}:${effDensity()}:${effWind()}`,
    () =>
      controller?.update({
        preset: active(),
        density: effDensity(),
        wind: effWind(),
      }),
  )

  onCleanup(() => {
    cancelled = true
    controller?.destroy()
    controller = undefined
  })
}
