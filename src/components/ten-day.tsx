import { For } from 'solid-js'
import type { JSX } from '@solidjs/web'
import { conditionGlyph } from '../lib/weather/conditions.ts'
import { tempColor } from '../lib/weather/conditions.ts'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const dayName = (date: string, index: number): string => {
  if (index === 0) return 'Today'
  const d = new Date(`${date}T12:00:00`)
  return DAY_NAMES[d.getDay()]
}

const col = (v: number): string => tempColor(v)

export const TenDay = (props: {
  readonly days: ReadonlyArray<{
    date: string
    code: number
    max: number
    min: number
    precipProbMax: number
  }>
  readonly currentTemp?: number
}): JSX.Element => {
  const days = props.days
  const globalMin = Math.min(...days.map((d) => d.min))
  const globalMax = Math.max(...days.map((d) => d.max))
  const range = globalMax - globalMin || 1
  const leftOf = (t: number): number => ((t - globalMin) / range) * 100
  const widthOf = (lo: number, hi: number): number =>
    Math.max(3, ((hi - lo) / range) * 100)

  return (
    <div>
      <For each={days}>
        {(row, i) => {
          const segLeft = leftOf(row.min)
          const segWidth = widthOf(row.min, row.max)
          const isToday = i() === 0 && props.currentTemp !== undefined
          const dotLeft =
            props.currentTemp !== undefined
              ? Math.max(0, Math.min(100, leftOf(props.currentTemp)))
              : 0
          return (
            <div class="grid grid-cols-[58px_62px_26px_1fr_26px] items-center gap-2 border-t border-white/10 py-2.5 text-[17px] first:border-t-0">
              <span class="font-medium">{dayName(row.date, i())}</span>
              <span>
                {conditionGlyph(row.code)}
                {row.precipProbMax > 0 ? (
                  <span class="ml-1 text-xs font-semibold text-accent-blue">
                    {row.precipProbMax}%
                  </span>
                ) : null}
              </span>
              <span class="text-right text-ink-2">{Math.round(row.min)}°</span>
              <span class="relative h-1.5 rounded bg-white/15">
                <span
                  class="absolute top-0 h-full rounded"
                  style={{
                    left: `${segLeft}%`,
                    width: `${segWidth}%`,
                    background: `linear-gradient(90deg, ${col(row.min)}, ${col(row.max)})`,
                  }}
                />
                {isToday ? (
                  <span
                    class="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
                    style={{ left: `${dotLeft}%` }}
                  />
                ) : null}
              </span>
              <span class="text-right font-medium">{Math.round(row.max)}°</span>
            </div>
          )
        }}
      </For>
    </div>
  )
}
