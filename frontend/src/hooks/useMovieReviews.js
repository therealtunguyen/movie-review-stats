import { useQuery } from '@tanstack/react-query'
import { fetchMovieReviews } from '../api'

export function useMovieReviews(movieId) {
  return useQuery({
    queryKey: ['movies', movieId, 'reviews'],
    queryFn: () => fetchMovieReviews(movieId),
    enabled: !!movieId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
