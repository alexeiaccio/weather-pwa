import { describe, expect, test } from 'vitest'
import {
  conditionGlyph,
  conditionLabel,
  skyFor,
  tempColor,
} from '../../src/lib/weather/conditions'

describe('condition mapping', () => {
  test('labels WMO codes', () => {
    expect(conditionLabel(0)).toBe('Clear')
    expect(conditionLabel(63)).toBe('Rain')
    expect(conditionLabel(95)).toBe('Thunderstorm')
    expect(conditionLabel(9999)).toBe('Partly Cloudy') // unknown → fallback
  })

  test('glyphs exist for the MVP range', () => {
    expect(conditionGlyph(2)).toBe('⛅')
    expect(conditionGlyph(95)).toBe('⛈️')
  })

  test('skyFor picks day, night, and storm families', () => {
    expect(skyFor(0, 1)).toEqual({ top: '#5b8fc0', bottom: '#3c658f' })
    expect(skyFor(0, 0)).toEqual({ top: '#1a2b3d', bottom: '#0d1520' })
    expect(skyFor(95, 1).bottom).toBe('#1c2740')
    expect(skyFor(63, 1).top).toBe('#52677c')
  })
})

describe('tempColor', () => {
  test('is cold blue for freezing and hot red-orange for heat', () => {
    const cold = tempColor(-10)
    const hot = tempColor(40)
    expect(cold).toBe('rgb(74,153,255)')
    expect(hot).toBe('rgb(255,99,97)')
  })

  test('is a valid rgb() string at an interior value', () => {
    expect(tempColor(18)).toMatch(/^rgb\(\d+,\d+,\d+\)$/)
  })
})
