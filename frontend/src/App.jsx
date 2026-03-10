import { useState, useRef, useEffect } from 'react'
import { useMovieReviews } from './hooks/useMovieReviews'
import SearchBar from './components/SearchBar'
import MovieHeader from './components/MovieHeader'
import EmptyState from './components/EmptyState'

import SentimentArc from './components/SentimentArc'
import ScoreScatter from './components/ScoreScatter'

export default function App() {
  const [selectedMovie, setSelectedMovie] = useState(null)
  const { data: reviewData, isLoading, isError, error } = useMovieReviews(selectedMovie?.id)
  const detailRef = useRef(null)

  useEffect(() => {
    if (selectedMovie && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedMovie])

  const reviews = reviewData?.reviews ?? []

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Sentiment Observatory</h1>
          <p className="text-gray-400 mt-1">Explore how audiences really feel about movies</p>
        </header>

        {/* Search */}
        <SearchBar onSelectMovie={setSelectedMovie} />

        {/* Movie detail section */}
        {selectedMovie && (
          <div className="mt-8" ref={detailRef}>
            {isLoading && (
              <div className="text-center py-16 text-gray-400">
                <p>Loading reviews...</p>
              </div>
            )}

            {isError && (
              <div className="text-center py-16 text-red-400">
                <p>Failed to load reviews: {error?.message}</p>
              </div>
            )}

            {!isLoading && !isError && (
              <>
                <MovieHeader movie={selectedMovie} reviewCount={reviews.length} />

                {reviews.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="mt-6 space-y-6">
                    <SentimentArc reviews={reviews} />
                    <ScoreScatter reviews={reviews} />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
