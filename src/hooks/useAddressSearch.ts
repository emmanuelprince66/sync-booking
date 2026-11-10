import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { queryKeys } from '@/api/query-keys'
import { fetchAddressSuggestions, isAddressLookupEnabled } from '@/lib/address'
import { useDebounce } from './useDebounce'
import { useMenu } from './useMenu'

/** Suggestions for an address box: open while typing, closed on an outside click, Escape or a pick. */
export function useAddressSearch(value: string) {
  const enabled = isAddressLookupEnabled()
  const menu = useMenu()
  const [typed, setTyped] = useState(false)
  const term = useDebounce(value.trim(), 300)
  const query = useQuery({
    queryKey: [...queryKeys.addressSearch, term],
    queryFn: () => fetchAddressSuggestions(term),
    enabled: enabled && typed && term.length >= 3,
    staleTime: 5 * 60 * 1000,
  })
  return {
    enabled,
    rootRef: menu.rootRef,
    isOpen: enabled && typed && menu.open && term.length >= 3,
    isSearching: query.isFetching,
    suggestions: query.data ?? [],
    onType: () => { setTyped(true); menu.show() },
    close: menu.close,
  }
}
