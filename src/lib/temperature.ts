export const celsiusToDisplay = (c: number): number => Math.round(c)

export const highLow = (
  temps: readonly number[],
): { hi: number; lo: number } => ({
  hi: Math.round(Math.max(...temps)),
  lo: Math.round(Math.min(...temps)),
})
