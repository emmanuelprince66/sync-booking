import { useCallback } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { useUiStore } from '@/stores/ui-store'

/** Opens the app-wide booking dialogs (mounted once in the shell) from any screen. */
export function useBookingActions() {
  const setNewBookingOpen = useUiStore(state => state.setNewBookingOpen)
  const setSelectedBookingId = useUiStore(state => state.setSelectedBookingId)
  const { canAddBooking } = usePermissions()
  return {
    /** New booking (lib/access-map addBooking: bookings:create). */
    canAddBooking,
    openNewBooking: useCallback(() => setNewBookingOpen(true), [setNewBookingOpen]),
    openBooking: useCallback((id: string) => setSelectedBookingId(id), [setSelectedBookingId]),
  }
}
