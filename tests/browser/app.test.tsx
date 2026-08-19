import { describe, expect, test } from 'vitest'
import { render } from '@solidjs/testing-library'
import App from '../../src/app'

describe('app smoke test', () => {
  test('renders the hero temperature and current-location chip', async () => {
    const screen = render(() => <App />)
    expect(await screen.findByText('16°')).toBeTruthy()
    expect(await screen.findByText(/Current location/)).toBeTruthy()
  })
})
