import type { BookingStatus, CheckoutMethod, RefundMethod } from '@/api/bookings'

export const PAYMENT_METHODS: { value: CheckoutMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'TRANSFER', label: 'Transfer' },
]

export const REFUND_METHODS: { value: RefundMethod; label: string }[] = [
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CASH', label: 'Cash' },
]

export type BookingsTab = 'All' | 'Upcoming' | 'Refunds'

export const BOOKING_TABS: { value: BookingsTab; label: string }[] = (['All', 'Upcoming', 'Refunds'] as const).map(value => ({ value, label: value }))

export const BOOKINGS_PAGE_SIZE = 10
export const BOOKINGS_PAGE_SIZES = [10, 20, 50] as const

/** The list endpoint's `status` filter, in lifecycle order. */
export const BOOKING_STATUS_FILTERS: { value: BookingStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'RESCHEDULED', label: 'Rescheduled' },
  { value: 'NO_SHOW', label: 'No show' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export const REFUND_FILTERS = [
  { value: 'REFUND_PENDING', label: 'Pending' },
  { value: 'REFUNDED', label: 'Disbursed' },
  { value: 'REFUND', label: 'All refunds' },
] as const
