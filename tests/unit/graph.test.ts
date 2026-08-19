import { describe, expect, test } from 'vitest'
import {
  bandBlock,
  fillToBaseline,
  hourLabel,
  smoothPath,
  type Pt,
} from '../../src/lib/weather/graph'

const line = (xs: number[], ys: number[]): Pt[] =>
  xs.map((x, i) => ({ x, y: ys[i] }))

describe('smoothPath (Catmull-Rom → Bézier)', () => {
  test('empty input returns empty, single point emits M only', () => {
    expect(smoothPath([])).toBe('')
    expect(smoothPath([{ x: 1, y: 2 }])).toBe('M 1,2')
  })

  test('two points produce an M then one C command', () => {
    const d = smoothPath(line([0, 10], [0, 0]))
    expect(d.startsWith('M 0.0,0.0')).toBe(true)
    expect(d.includes(' C ')).toBe(true)
  })

  test('is monotonic and grows monotonically in x', () => {
    const d = smoothPath(line([0, 10, 20, 30], [10, 5, 8, 3]))
    const xs = [...d.matchAll(/[MC] ([\d.-]+),/g)].map((m) => Number(m[1]))
    for (let i = 1; i < xs.length; i++)
      expect(xs[i]).toBeGreaterThanOrEqual(xs[i - 1])
  })
})

describe('fillToBaseline', () => {
  test('closes the curve back to the baseline with Z', () => {
    const pts = line([0, 10], [5, 5])
    const d = fillToBaseline(pts, 40)
    expect(d.endsWith(' Z')).toBe(true)
    expect(d).toContain(`L 10.0,40`)
    expect(d).toContain(`L 0.0,40`)
  })
})

describe('bandBlock', () => {
  test('produces a 4-point closed path', () => {
    const d = bandBlock(0, 10, 40, 20, 25)
    expect(d).toContain('M 0,40')
    expect(d).toContain(`L 0,${(40 + 20).toFixed(1)}`)
    expect(d).toContain(`L 10,${(40 + 25).toFixed(1)}`)
    expect(d).toContain('L 10,40 Z')
  })
})

describe('hourLabel', () => {
  test('first index is Now, others are compact 12h labels', () => {
    expect(hourLabel('2026-08-19T09:00', 0)).toBe('Now')
    expect(hourLabel('2026-08-19T09:00', 3)).toBe('9a')
    expect(hourLabel('2026-08-19T15:00', 5)).toBe('3p')
    expect(hourLabel('2026-08-19T00:00', 1)).toBe('12a')
  })
})
