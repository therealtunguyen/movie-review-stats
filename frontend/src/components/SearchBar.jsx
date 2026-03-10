import { useState, useEffect } from 'react'
import { useSearchMovies } from '../hooks/useSearchMovies'
import MovieCard from './MovieCard'

export default function SearchBar({ onSelectMovie }) {
  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(inputValue), 300)
    return () => clearTimeout(timer)
  }, [inputValue])

  const { data: movies, isFetching, isError } = useSearchMovies(debouncedQuery)

  function handleSelect(movie) {
    onSelectMovie(movie)
    setInputValue('')
    setDebouncedQuery('')
  }

  return (
    <div className="w-full">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Search for a movie..."
        className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-blue-500"
        aria-label="Search for a movie"
      />
      {isFetching && (
        <p className="text-gray-400 text-sm mt-2">Searching...</p>
      )}
      {isError && (
        <p className="text-red-400 text-sm mt-2">Search failed. Is the backend running?</p>
      )}
      {movies && movies.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {movies.slice(0, 8).map((movie) => (
            <MovieCard key={movie.id} movie={movie} onClick={() => handleSelect(movie)} />
          ))}
        </div>
      )}
    </div>
  )
}
