import { useCallback } from 'react'
import { useUiStore } from '@/stores/ui-store'

/** Opens the app-wide booking dialogs (mounted once in the shell) from any screen. */
export function useBookingActions() {
  const setNewBookingOpen = useUiStore(state => state.setNewBookingOpen)
  const setSelectedBookingId = useUiStore(state => state.setSelectedBookingId)
  return {
    openNewBooking: useCallback(() => setNewBookingOpen(true), [setNewBookingOpen]),
    openBooking: useCallback((id: string) => setSelectedBookingId(id), [setSelectedBookingId]),
  }
}
