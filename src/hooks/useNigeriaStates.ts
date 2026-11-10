import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/api/query-keys'
import { loadNigeriaStates } from '@/lib/address'

/** Nigerian states with their cities, fetched once per session. */
export const useNigeriaStates = () => useQuery({ queryKey: queryKeys.nigeriaPlaces, queryFn: loadNigeriaStates, staleTime: Infinity, gcTime: Infinity })
