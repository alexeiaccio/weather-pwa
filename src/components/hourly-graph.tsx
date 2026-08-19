import { createSignal, For, Show } from 'solid-js'
import type { JSX } from '@solidjs/web'
import {
  bandBlock,
  fillToBaseline,
  hourLabel,
  smoothPath,
  type Pt,
} from '../lib/weather/graph.ts'

const W = 420
const PAD_TOP = 12
const CURVE_H = 132
const BAND_GAP = 12
const BAND_H = 44
const H = PAD_TOP + CURVE_H + BAND_GAP + BAND_H + 18

interface Highlight {
  readonly index: number
  readonly x: number
  readonly y: number
}

const HOUR_LABEL_EVERY = 3

export const HourlyGraph = (props: {
  readonly forecast: {
    readonly hourly: ReadonlyArray<{
      readonly time: string
      readonly temp: number
      readonly precipProb: number
    }>
  }
}): JSX.Element => {
  const hourly = props.forecast.hourly
  const n = hourly.length
  const slot = W / n
  const x = (i: number): number => i * slot + slot / 2
  const temps = hourly.map((h) => h.temp)
  const tMin = Math.min(...temps)
  const tMax = Math.max(...temps)
  const pad = Math.max(2, (tMax - tMin) * 0.12)
  const yOf = (t: number): number =>
    PAD_TOP + (1 - (t - (tMin - pad)) / (tMax - tMin + 2 * pad)) * CURVE_H
  const bandTop = PAD_TOP + CURVE_H + BAND_GAP
  const pts: Pt[] = hourly.map((h, i) => ({ x: x(i), y: yOf(h.temp) }))
  const bandY = (prob: number): number =>
    bandTop + (1 - Math.max(0, Math.min(100, prob)) / 100) * BAND_H

  const [hi, setHi] = createSignal<Highlight | null>(null)

  interface Hover {
    readonly x: number
    readonly y: number
    readonly row: (typeof hourly)[number]
  }
  const hover = (): Hover | null => {
    const h = hi()
    return h ? { x: h.x, y: h.y, row: hourly[h.index] } : null
  }

  const onMove = (ev: PointerEvent): void => {
    const svg = (ev.currentTarget as SVGSVGElement).getBoundingClientRect()
    const idx = Math.max(
      0,
      Math.min(
        n - 1,
        Math.round(((ev.clientX - svg.left) / svg.width) * n - 0.5),
      ),
    )
    setHi({ index: idx, x: x(idx), y: yOf(hourly[idx].temp) })
  }

  const curve = smoothPath(pts)
  const fill = fillToBaseline(pts, bandTop)
  const h = hover()

  return (
    <div class="relative" style={{ 'touch-action': 'pan-y' }}>
      <Show when={h} fallback={null}>
        {(hv) => {
          const hh = hv()
          return (
            <div
              class="pointer-events-none absolute z-10 rounded-lg bg-black/70 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-white"
              style={{
                left: `${(hh.x / W) * 100}%`,
                top: `${Math.max(0, (hh.y / H) * 100 - 8)}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              {hh.row.time} · {Math.round(hh.row.temp)}° · {hh.row.precipProb}%{' '}
              {hh.row.precipProb > 0 ? '🌧' : ''}
            </div>
          )
        }}
      </Show>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        class="block w-full touch-none select-none"
        style={{ cursor: 'crosshair' }}
        onPointerMove={onMove}
        onPointerLeave={() => setHi(null)}
      >
        <defs>
          <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#ffffff" stop-opacity="0.5" />
            <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path d={fill} fill="url(#curve-fill)" />
        <For each={hourly}>
          {(row, i) => (
            <path
              d={bandBlock(
                x(i()),
                x(i() + 1),
                bandTop,
                bandY(row.precipProb) - bandTop,
                bandY(row.precipProb) - bandTop,
              )}
              fill="var(--color-accent-blue)"
              fill-opacity="0.3"
            />
          )}
        </For>
        <path
          d={curve}
          fill="none"
          stroke="#ffffff"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />
        <line
          x1="0"
          y1={bandTop}
          x2={W}
          y2={bandTop}
          stroke="rgba(255,255,255,0.18)"
          vector-effect="non-scaling-stroke"
        />
        <For each={hourly}>
          {(row, i) =>
            i() % HOUR_LABEL_EVERY === 0 ? (
              <text
                x={x(i())}
                y={bandTop + 13}
                text-anchor={
                  i() === 0 ? 'start' : i() === n - 1 ? 'end' : 'middle'
                }
                font-size="10"
                fill="rgba(255,255,255,0.65)"
              >
                {hourLabel(row.time, i())}
              </text>
            ) : null
          }
        </For>
        <Show when={h} fallback={null}>
          {(hv) => {
            const hh = hv()
            return (
              <>
                <line
                  x1={hh.x}
                  y1={PAD_TOP}
                  x2={hh.x}
                  y2={bandTop + BAND_H}
                  stroke="rgba(255,255,255,0.85)"
                  vector-effect="non-scaling-stroke"
                />
                <circle
                  cx={hh.x}
                  cy={hh.y}
                  r="4.5"
                  fill="#fff"
                  stroke="rgba(0,0,0,0.3)"
                />
              </>
            )
          }}
        </Show>
      </svg>
    </div>
  )
}
