import { describe, expect, test } from 'vitest'
import { render, waitFor } from '@solidjs/testing-library'
import App from '../../src/app.tsx'

describe('app smoke test', () => {
  test('renders the weather screen and (no geolocation) search prompt', async () => {
    const screen = render(() => <App />)
    expect(await screen.findByTestId('weather-screen')).toBeTruthy()
    // Headless chromium grants nothing: the pinned place (IndexedDB) is empty
    // and geolocation is denied, so the app falls through to the empty state
    // (W3). The IndexedDB read + geolocation resolve on microtasks/timers.
    await waitFor(
      () => {
        expect(
          screen.getByText(/Turn on location, or pin a city below/),
        ).toBeTruthy()
      },
      { timeout: 5000 },
    )
  })
})
