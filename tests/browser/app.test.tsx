import { describe, expect, test } from 'vitest'
import { render } from '@solidjs/testing-library'
import App from '../../src/app.tsx'

describe('app smoke test', () => {
  test('renders the weather screen and (no geolocation) search prompt', async () => {
    const screen = render(() => <App />)
    expect(await screen.findByTestId('weather-screen')).toBeTruthy()
    // Headless chromium denies geolocation and there is no pinned place, so the
    // app falls through to the search empty state (W3).
    expect(
      await screen.findByText(/Turn on location, or pin a city below/),
    ).toBeTruthy()
  })
})
