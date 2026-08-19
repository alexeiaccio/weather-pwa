export type Pt = { readonly x: number; readonly y: number }

/**
 * Catmull-Rom → cubic Bézier smoothing for an hourly temperature curve (W2).
 * Each interior segment uses the neighboring points as tangent handles; the
 * endpoints clamp to themselves. Returns an SVG `d` path string.
 */
export const smoothPath = (pts: readonly Pt[]): string => {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }
  return d
}

/** Close a curve to a baseline for the under-line gradient fill. */
export const fillToBaseline = (
  pts: readonly Pt[],
  baselineY: number,
): string =>
  pts.length === 0
    ? ''
    : `${smoothPath(pts)} L ${pts[pts.length - 1].x.toFixed(1)},${baselineY} L ${pts[0].x.toFixed(1)},${baselineY} Z`

/** One per-hour precipitation block whose top edge tapers to the neighbor. */
export const bandBlock = (
  x0: number,
  x1: number,
  top: number,
  height0: number,
  height1: number,
): string =>
  `M ${x0},${top} L ${x0},${(top + height0).toFixed(1)} L ${x1},${(top + height1).toFixed(1)} L ${x1},${top} Z`

/** Compact hour label for the axis, e.g. "9a", "3p", "Now". */
export const hourLabel = (time: string, index: number): string => {
  if (index === 0) return 'Now'
  const m = /T(\d{2})/.exec(time)
  const h = m ? Number(m[1]) : Number(time.slice(0, 2))
  const s = h % 12 === 0 ? 12 : h % 12
  return `${s}${h < 12 ? 'a' : 'p'}`
}
