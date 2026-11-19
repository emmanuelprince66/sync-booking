import { useCallback } from 'react'
import { usePlanGate } from '@/api/plan'
import { usePermissions } from '@/hooks/usePermissions'
import { useUiStore } from '@/stores/ui-store'

/** Opens the app-wide booking dialogs (mounted once in the shell) from any screen. */
export function useBookingActions() {
  const setNewBookingOpen = useUiStore(state => state.setNewBookingOpen)
  const setSelectedBookingId = useUiStore(state => state.setSelectedBookingId)
  const { canAddBooking } = usePermissions()
  const gate = usePlanGate()
  // Monthly bookings on the plan are used up (no_of_bookings; -1 or unknown never blocks).
  const atBookingLimit = gate.atLimit('no_of_bookings')
  const bookingLimit = gate.limit('no_of_bookings')
  return {
    /** New booking (lib/access-map addBooking: bookings:create). */
    canAddBooking,
    atBookingLimit,
    bookingLimitNote: atBookingLimit ? `You’ve used all ${typeof bookingLimit === 'number' ? `${bookingLimit.toLocaleString()} ` : ''}bookings on your plan this month.` : '',
    openNewBooking: useCallback(() => { if (!atBookingLimit) setNewBookingOpen(true) }, [atBookingLimit, setNewBookingOpen]),
    openBooking: useCallback((id: string) => setSelectedBookingId(id), [setSelectedBookingId]),
  }
}
