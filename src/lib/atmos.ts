/** Map a WMO code to an atmos-fx foreground-preset (or none). */
export type AtmosPreset = 'rain' | 'snow' | 'hail' | 'none'

export const conditionToAtmos = (code: number): AtmosPreset => {
  if (code >= 95) return 'hail' // thunderstorm family reads as hard hail
  if (code >= 80 && code <= 99) return 'rain' // showers/thunder
  if (code >= 61 && code <= 65) return 'rain' // rain
  if (code >= 71 && code <= 77) return 'snow' // snow
  return 'none'
}
