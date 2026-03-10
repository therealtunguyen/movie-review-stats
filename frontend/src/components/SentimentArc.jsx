import { useState, useRef } from 'react'
import {
  ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts'
import { effectiveSentiment, sentimentColor, arcTitle } from '../utils/sentiment'
import { rollingAverage } from '../utils/stats'
import { downloadChartPng } from '../utils/chartExport'
import CustomTooltip from './CustomTooltip'
import ChartControls from './ChartControls'

// Generate tick indices based on date cadence
function getTickIndices(sorted, isMonthly) {
  if (sorted.length <= 1) return [0]
  const cadenceDays = isMonthly ? 30 : 7
  const cadenceMs = cadenceDays * 24 * 60 * 60 * 1000
  const first = new Date(sorted[0].created_at).getTime()
  const ticks = [0]
  let lastTickTime = first
  sorted.forEach((r, i) => {
    if (i === 0) return
    const t = new Date(r.created_at).getTime()
    if (t - lastTickTime >= cadenceMs) {
      ticks.push(i)
      lastTickTime = t
    }
  })
  // Always include last
  const last = sorted.length - 1
  if (ticks[ticks.length - 1] !== last) ticks.push(last)
  // Limit to max 10 ticks to avoid overcrowding
  if (ticks.length > 10) {
    const step = Math.ceil(ticks.length / 10)
    return ticks.filter((_, i) => i % step === 0 || i === ticks.length - 1)
  }
  return ticks
}

function formatDateTick(dateStr, isMonthly) {
  const d = new Date(dateStr)
  if (isMonthly) {
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function SentimentArc({ reviews }) {
  const [displayMode, setDisplayMode] = useState('both')
  const chartRef = useRef(null)

  if (!reviews || reviews.length === 0) return null

  // Sort chronologically
  const sorted = [...reviews].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  // Compute effective sentiment for each review
  const withEffective = sorted.map((r) => {
    const effective = effectiveSentiment(r.sentiment_label, r.sentiment_score)
    return { ...r, effective, color: sentimentColor(effective), value: effective }
  })

  // Rolling average data — rollingAverage expects items with a `value` field
  const averaged = rollingAverage(withEffective, 7)

  // Determine tick density
  const firstDate = new Date(sorted[0].created_at)
  const lastDate = new Date(sorted[sorted.length - 1].created_at)
  const rangeMs = lastDate - firstDate
  const threeMonthsMs = 90 * 24 * 60 * 60 * 1000
  const isMonthly = rangeMs >= threeMonthsMs

  // Dynamic title
  const trend = arcTitle(sorted)
  const titleMap = {
    improved: 'Sentiment improved over time',
    declined: 'Sentiment declined over time',
    'remained stable': 'Sentiment remained stable over time',
  }
  const title = titleMap[trend] || 'Sentiment over time'

  // Scatter data uses index as x for consistent positioning across both datasets
  const scatterData = withEffective.map((r, i) => ({ ...r, x: i }))
  const trendData = averaged.map((r, i) => ({ x: i, avg: r.avg }))

  // X-axis ticks — date-cadence based (weekly or monthly)
  const tickIndices = getTickIndices(sorted, isMonthly)

  const handleDownload = () => {
    if (chartRef.current) downloadChartPng(chartRef.current, 'sentiment-arc.png')
  }

  return (
    <div
      className="bg-gray-800 rounded-lg p-6"
      aria-label="Sentiment arc chart showing sentiment over time"
    >
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <span className="sr-only">
            Chart showing sentiment scores of {reviews.length} reviews over time. Sentiment {trend}.
          </span>
        </div>
        <ChartControls
          displayMode={displayMode}
          setDisplayMode={setDisplayMode}
          onDownload={handleDownload}
        />
      </div>
      <div ref={chartRef} className="mb-2">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[0, sorted.length - 1]}
              ticks={tickIndices}
              tickFormatter={(i) => {
                const review = sorted[Math.round(i)]
                return review ? formatDateTick(review.created_at, isMonthly) : ''
              }}
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
            />
            <YAxis
              domain={[0, 1]}
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickFormatter={(v) => v.toFixed(1)}
              label={{ value: 'Sentiment', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0.5} stroke="#6b7280" strokeDasharray="4 4" />

            {(displayMode === 'points' || displayMode === 'both') && (
              <Scatter
                data={scatterData}
                dataKey="effective"
                shape={(props) => {
                  const { cx, cy, payload } = props
                  return (
                    <circle cx={cx} cy={cy} r={5} fill={payload.color} fillOpacity={0.85} style={{ pointerEvents: 'all' }} />
                  )
                }}
              />
            )}

            {(displayMode === 'trend' || displayMode === 'both') && (
              <Line
                data={trendData}
                type="monotone"
                dataKey="avg"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                connectNulls
                tooltipType="none"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-gray-500 text-xs mt-2">
        0 = Negative, 1 = Positive. Trend line shows 7-review rolling average.
      </p>
    </div>
  )
}
