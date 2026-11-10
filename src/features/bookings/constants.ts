import type { CheckoutMethod, RefundMethod } from '@/api/bookings'

export const PAYMENT_METHODS: { value: CheckoutMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'TRANSFER', label: 'Transfer' },
]

export const REFUND_METHODS: { value: RefundMethod; label: string }[] = [
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CASH', label: 'Cash' },
]

export type BookingsTab = 'All' | 'Upcoming' | 'Confirmed' | 'Pending' | 'Completed' | 'Refunds'

export const BOOKING_TABS: { value: BookingsTab; label: string }[] = (['All', 'Upcoming', 'Confirmed', 'Pending', 'Completed', 'Refunds'] as const).map(value => ({ value, label: value }))

export const BOOKINGS_PAGE_SIZE = 10

export const REFUND_FILTERS = [
  { value: 'REFUND_PENDING', label: 'Pending' },
  { value: 'REFUNDED', label: 'Disbursed' },
  { value: 'REFUND', label: 'All refunds' },
] as const
