/**
 * WMO weather code → condition label, glyph, and sky-gradient family.
 * Maps the 42-condition scene vocabulary from the W2 research onto the WMO
 * codes the Open-Meteo API (W1) actually returns.
 */

const LABELS: Record<number, string> = {
  0: 'Clear',
  1: 'Mostly Sunny',
  2: 'Partly Cloudy',
  3: 'Mostly Cloudy',
  45: 'Fog',
  48: 'Fog',
  51: 'Light Drizzle',
  53: 'Drizzle',
  55: 'Dense Drizzle',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  80: 'Showers',
  81: 'Heavy Showers',
  82: 'Violent Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Severe Thunderstorm',
}

export const conditionLabel = (code: number): string =>
  LABELS[code] ?? 'Partly Cloudy'

const GLYPHS: Record<number, string> = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  55: '🌧️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  71: '🌨️',
  73: '🌨️',
  75: '🌨️',
  80: '🌦️',
  81: '🌦️',
  82: '🌧️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
}

export const conditionGlyph = (code: number): string => GLYPHS[code] ?? '⛅'

export type SkyStop = { readonly top: string; readonly bottom: string }

/** Sky-gradient family by condition + day/night (W2 token model). */
export const skyFor = (code: number, isDay: number): SkyStop => {
  if (code >= 95) return { top: '#2b3b52', bottom: '#1c2740' } // thunderstorm
  if (code >= 80) return { top: '#52677c', bottom: '#3c4d5f' } // showers
  if (code >= 61 && code <= 65) return { top: '#52677c', bottom: '#3c4d5f' } // rain
  if (code >= 71 && code <= 77) return { top: '#8299ad', bottom: '#5c7185' } // snow
  if (code === 45 || code === 48) return { top: '#6f7d8c', bottom: '#55626f' } // fog
  if (isDay > 0) return { top: '#5b8fc0', bottom: '#3c658f' } // day: steel blue
  return { top: '#1a2b3d', bottom: '#0d1520' } // night: near-black navy
}

/** Temperature → bar color (cold blue → green → amber → red), W2 10-day lane. */
const STOPS: ReadonlyArray<
  readonly [number, readonly [number, number, number]]
> = [
  [-10, [74, 153, 255]],
  [5, [111, 215, 168]],
  [18, [255, 210, 107]],
  [28, [255, 157, 92]],
  [40, [255, 99, 97]],
]

export const tempColor = (t: number): string => {
  let a = STOPS[0]
  let b = STOPS[STOPS.length - 1]
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (t >= STOPS[i][0] && t <= STOPS[i + 1][0]) {
      a = STOPS[i]
      b = STOPS[i + 1]
      break
    }
  }
  const span = b[0] - a[0] === 0 ? 1 : b[0] - a[0]
  const k = Math.max(0, Math.min(1, (t - a[0]) / span))
  const ch = a[1].map((v, i) => Math.round(v + (b[1][i] - v) * k))
  return `rgb(${ch.join(',')})`
}
