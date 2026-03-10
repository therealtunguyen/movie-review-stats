import { useQuery } from '@tanstack/react-query'
import { searchMovies } from '../api'

export function useSearchMovies(query) {
  return useQuery({
    queryKey: ['movies', 'search', query],
    queryFn: () => searchMovies(query),
    enabled: (query?.length ?? 0) >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (prev) => prev, // keep previous data while loading
  })
}
