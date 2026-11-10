import { create } from 'zustand'

/** Session-only UI flags (not persisted). The booking dialogs live in the app shell and open from any screen. */
type UiState = {
  /** Phone/tablet slide-in sidebar. */
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  newBookingOpen: boolean
  setNewBookingOpen: (open: boolean) => void
  selectedBookingId: string | null
  setSelectedBookingId: (id: string | null) => void
}

export const useUiStore = create<UiState>()(set => ({
  mobileNavOpen: false,
  setMobileNavOpen: open => set({ mobileNavOpen: open }),
  newBookingOpen: false,
  setNewBookingOpen: open => set({ newBookingOpen: open }),
  selectedBookingId: null,
  setSelectedBookingId: id => set({ selectedBookingId: id }),
}))
