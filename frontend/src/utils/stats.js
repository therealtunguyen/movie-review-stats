/**
 * Centered rolling average over sorted array.
 * Returns array of { index, value, avg } where avg may be null at edges.
 */
export function rollingAverage(sorted, window = 7) {
  const half = Math.floor(window / 2)
  return sorted.map((item, i) => {
    const start = Math.max(0, i - half)
    const end = Math.min(sorted.length - 1, i + half)
    const slice = sorted.slice(start, end + 1)
    const avg = slice.reduce((s, x) => s + x.value, 0) / slice.length
    return { ...item, avg }
  })
}

/**
 * Pearson correlation coefficient for two arrays of equal length.
 */
export function pearsonR(x, y) {
  const n = x.length
  if (n < 2) return 0
  const mx = x.reduce((a, b) => a + b, 0) / n
  const my = y.reduce((a, b) => a + b, 0) / n
  const num = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0)
  const den = Math.sqrt(
    x.reduce((s, xi) => s + (xi - mx) ** 2, 0) *
    y.reduce((s, yi) => s + (yi - my) ** 2, 0)
  )
  return den === 0 ? 0 : num / den
}

/**
 * Simple linear regression. Returns { slope, intercept }.
 */
export function linearRegression(x, y) {
  const n = x.length
  if (n < 2) return { slope: 0, intercept: 0 }
  const mx = x.reduce((a, b) => a + b, 0) / n
  const my = y.reduce((a, b) => a + b, 0) / n
  const slope = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0) /
    x.reduce((s, xi) => s + (xi - mx) ** 2, 0)
  const intercept = my - slope * mx
  return { slope, intercept }
}

/**
 * Human-readable correlation description.
 */
export function describeCorrelation(r) {
  const abs = Math.abs(r)
  if (abs >= 0.7) return 'strong'
  if (abs >= 0.4) return 'moderate'
  if (abs >= 0.2) return 'weak'
  return 'no meaningful'
}
