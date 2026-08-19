import { createEffect, onCleanup } from 'solid-js'
import type { JSX } from '@solidjs/web'
import { Sky } from '../lib/three/sky.ts'

/**
 * Three.js animated weather background. Mounts the Sky engine into an absolute,
 * pointer-transparent layer; updates the atmosphere when the condition or
 * day/night changes; tears the WebGL context down on unmount.
 */
export const Sky3D = (props: {
  readonly code: number
  readonly isDay: number
}): JSX.Element => {
  let ref: HTMLDivElement | undefined
  let sky: Sky | undefined

  createEffect(
    () => ref,
    () => {
      if (ref && !sky) {
        sky = new Sky(ref)
        sky.update(props.code, props.isDay)
      }
    },
  )

  createEffect(
    () => `${props.code}:${props.isDay}`,
    () => sky?.update(props.code, props.isDay),
  )

  onCleanup(() => {
    sky?.dispose()
    sky = undefined
  })

  return (
    <div
      ref={(el) => (ref = el)}
      class="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    />
  )
}
