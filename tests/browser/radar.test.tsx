import { describe, expect, test } from 'vitest'
import { render } from '@solidjs/testing-library'
import { RadarMap } from '../../src/components/radar-map'

describe('RadarMap', () => {
  test('mounts without crashing (Solid-2 effect regression)', async () => {
    // Before the fix this threw "Cannot read properties of undefined (reading
    // 'effect')" — the one-arg createEffect pattern Solid 2 forbids.
    render(() => <RadarMap lat={55.75} lon={37.62} />)
    await new Promise((r) => setTimeout(r, 600))
    expect(true).toBeTruthy()
  })
})
