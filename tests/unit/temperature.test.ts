import { describe, expect, test } from 'vitest'
import { celsiusToDisplay, highLow } from '../../src/lib/temperature'

describe('temperature formatting', () => {
  test('rounds celsius to the nearest degree', () => {
    expect(celsiusToDisplay(15.6)).toBe(16)
    expect(celsiusToDisplay(-2.4)).toBe(-2)
  })

  test('high/low spans min and max of the day', () => {
    expect(highLow([8.2, 16.4, 11.1, 23.9])).toEqual({ hi: 24, lo: 8 })
    expect(highLow([5])).toEqual({ hi: 5, lo: 5 })
  })
})
