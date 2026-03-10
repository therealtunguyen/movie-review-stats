export default function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const review = payload[0].payload
  if (!review.content && !review.author && !review.sentiment_label) return null

  const date = review.created_at
    ? new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : null

  const snippet = review.content
    ? review.content.length > 120
      ? review.content.slice(0, 120) + '…'
      : review.content
    : null

  const isPositive = review.sentiment_label === 'POSITIVE'

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 max-w-xs shadow-xl text-sm">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-semibold text-white truncate">{review.author || 'Anonymous'}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isPositive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}
        >
          {review.sentiment_label}
        </span>
      </div>
      {date && <p className="text-gray-400 text-xs mb-1">{date}</p>}
      {review.author_rating != null && (
        <p className="text-yellow-400 text-xs mb-1">★ {review.author_rating}/10</p>
      )}
      {review.isDisagree && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900 text-amber-300 font-medium">
          ⚠ Disagree
        </span>
      )}
      {snippet && <p className="text-gray-300 mt-2 text-xs leading-relaxed">{snippet}</p>}
    </div>
  )
}
