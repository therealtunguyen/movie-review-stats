export async function searchMovies(query) {
  const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Search failed')
  const data = await res.json()
  return data.results  // returns the results array
}

export async function fetchMovieReviews(movieId) {
  const res = await fetch(`/api/movies/${movieId}/reviews`)
  if (!res.ok) throw new Error('Failed to fetch reviews')
  return res.json()  // returns full response object
}
