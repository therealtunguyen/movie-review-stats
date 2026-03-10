/**
 * Transform backend confidence score to 0–1 sentiment scale.
 * CRITICAL: backend score = confidence in predicted label (always high).
 * POSITIVE + 0.95 → 0.95 (very positive)
 * NEGATIVE + 0.95 → 0.05 (very negative)
 */
export function effectiveSentiment(label, score) {
  return label === 'POSITIVE' ? score : 1 - score
}

/**
 * Map 0–1 sentiment to color: red(0) → grey(0.5) → green(1)
 */
export function sentimentColor(value) {
  if (value <= 0.5) {
    const t = value * 2 // 0→1 in [0, 0.5]
    const r = Math.round(239 + (156 - 239) * t)
    const g = Math.round(68 + (163 - 68) * t)
    const b = Math.round(68 + (163 - 68) * t)
    return `rgb(${r},${g},${b})`
  } else {
    const t = (value - 0.5) * 2 // 0→1 in [0.5, 1]
    const r = Math.round(156 + (34 - 156) * t)
    const g = Math.round(163 + (197 - 163) * t)
    const b = Math.round(163 + (94 - 163) * t)
    return `rgb(${r},${g},${b})`
  }
}

/**
 * Returns { color, isDisagree } based on quadrant:
 * high stars + high sentiment = green
 * low stars + low sentiment = red
 * off-diagonal = amber (isDisagree: true)
 * Star rating is 0–10. Threshold: 5 for stars, 0.5 for sentiment.
 */
export function quadrantColor(starRating, sentimentScore) {
  const highStars = starRating >= 5
  const highSentiment = sentimentScore >= 0.5
  if (highStars && highSentiment) return { color: '#22c55e', isDisagree: false }
  if (!highStars && !highSentiment) return { color: '#ef4444', isDisagree: false }
  return { color: '#f59e0b', isDisagree: true }
}

/**
 * Compare first 20% vs last 20% average sentiment.
 * Returns "improved" / "declined" / "remained stable"
 */
export function arcTitle(sortedReviews) {
  if (!sortedReviews || sortedReviews.length < 5) return 'remained stable'
  const n = sortedReviews.length
  const slice = Math.max(1, Math.floor(n * 0.2))
  const avg = (arr) => arr.reduce((s, r) => s + effectiveSentiment(r.sentiment_label, r.sentiment_score), 0) / arr.length
  const firstAvg = avg(sortedReviews.slice(0, slice))
  const lastAvg = avg(sortedReviews.slice(n - slice))
  const delta = lastAvg - firstAvg
  if (delta > 0.05) return 'improved'
  if (delta < -0.05) return 'declined'
  return 'remained stable'
}
