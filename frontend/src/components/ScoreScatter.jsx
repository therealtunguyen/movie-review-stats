import { useState, useRef } from 'react'
import {
  ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceArea, ResponsiveContainer
} from 'recharts'
import { effectiveSentiment, sentimentColor, quadrantColor } from '../utils/sentiment'
import { pearsonR, linearRegression, describeCorrelation } from '../utils/stats'
import { downloadChartPng } from '../utils/chartExport'
import CustomTooltip from './CustomTooltip'
import ChartControls from './ChartControls'

export default function ScoreScatter({ reviews }) {
  const [displayMode, setDisplayMode] = useState('both')
  const chartRef = useRef(null)

  if (!reviews || reviews.length === 0) return null

  // Filter reviews with ratings
  const rated = reviews.filter((r) => r.author_rating != null)

  if (rated.length < 2) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-gray-400 text-center">
        Not enough rated reviews to show correlation.
      </div>
    )
  }

  // Build scatter data
  const scatterData = rated.map((r) => {
    const effective = effectiveSentiment(r.sentiment_label, r.sentiment_score)
    const { color, isDisagree } = quadrantColor(r.author_rating, effective)
    return {
      ...r,
      x: r.author_rating,
      y: effective,
      color,
      isDisagree,
    }
  })

  // Pearson r
  const xs = scatterData.map((d) => d.x)
  const ys = scatterData.map((d) => d.y)
  const r = pearsonR(xs, ys)
  const { slope, intercept } = linearRegression(xs, ys)

  // Regression line endpoints
  const regressionData = [
    { x: 0, regY: Math.max(0, Math.min(1, intercept)) },
    { x: 10, regY: Math.max(0, Math.min(1, slope * 10 + intercept)) },
  ]

  const handleDownload = () => {
    if (chartRef.current) downloadChartPng(chartRef.current, 'score-scatter.png')
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6" aria-label="Score scatter chart showing correlation between star rating and sentiment">
      <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
        <div>
          <h3 className="text-white font-semibold text-lg">Stars vs. Sentiment</h3>
          <span className="sr-only">
            Scatter chart comparing {rated.length} reviews' star ratings against their sentiment scores.
          </span>
          <p className="text-gray-400 text-sm">
            {(() => { const d = describeCorrelation(r); return d.charAt(0).toUpperCase() + d.slice(1) })()} agreement
            {' '}(r = {r.toFixed(2)})
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            The closer r is to 1.0, the more a reviewer's star rating matches their words. Values near 0 suggest no relationship.
          </p>
        </div>
        <ChartControls displayMode={displayMode} setDisplayMode={setDisplayMode} onDownload={handleDownload} />
      </div>

      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 10]}
              label={{ value: 'Star Rating', position: 'insideBottom', offset: -10, fill: '#9ca3af', fontSize: 12 }}
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, 1]}
              label={{ value: 'Sentiment', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Quadrant backgrounds */}
            <ReferenceArea x1={5} x2={10} y1={0.5} y2={1} fill="#22c55e" fillOpacity={0.05} />
            <ReferenceArea x1={0} x2={5} y1={0} y2={0.5} fill="#ef4444" fillOpacity={0.05} />
            <ReferenceArea x1={0} x2={5} y1={0.5} y2={1} fill="#f59e0b" fillOpacity={0.05} />
            <ReferenceArea x1={5} x2={10} y1={0} y2={0.5} fill="#f59e0b" fillOpacity={0.05} />

            {/* Scatter points */}
            {(displayMode === 'points' || displayMode === 'both') && (
              <Scatter
                data={scatterData}
                shape={(props) => {
                  const { cx, cy, payload } = props
                  const radius = payload.isDisagree ? 7 : 5
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={payload.color}
                      fillOpacity={0.8}
                      stroke={payload.isDisagree ? '#f59e0b' : 'none'}
                      strokeWidth={payload.isDisagree ? 1.5 : 0}
                    />
                  )
                }}
              />
            )}

            {/* Regression line */}
            {(displayMode === 'trend' || displayMode === 'both') && (
              <Line
                data={regressionData}
                type="linear"
                dataKey="regY"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 3"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Annotation */}
      <p className="text-gray-500 text-xs mt-2 italic">
        Points far from the diagonal = your words and your stars don't match.
      </p>
    </div>
  )
}
