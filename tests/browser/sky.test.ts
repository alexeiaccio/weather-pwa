import { describe, expect, test } from 'vitest'
import { Sky } from '../../src/lib/three/sky'

const webglAvailable = (): boolean => {
  const c = document.createElement('canvas')
  return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
}

describe('Three.js sky engine', () => {
  test('mounts a canvas, updates atmosphere, and disposes cleanly', () => {
    // Headless chromium may lack a GPU context; skip rather than fail.
    if (!webglAvailable()) return

    const div = document.createElement('div')
    div.style.width = '400px'
    div.style.height = '240px'
    document.body.appendChild(div)

    const sky = new Sky(div)
    expect(div.querySelector('canvas')).toBeTruthy()

    // Criscross conditions/days to exercise the palette/particle branches.
    sky.update(0, 1) // clear day
    sky.update(2, 1) // partly cloudy
    sky.update(65, 1) // heavy rain
    sky.update(73, 0) // snow, night
    sky.update(45, 1) // fog
    sky.update(95, 0) // thunderstorm night

    sky.dispose()
    expect(div.querySelector('canvas')).toBeFalsy()
    div.remove()
  })
})
