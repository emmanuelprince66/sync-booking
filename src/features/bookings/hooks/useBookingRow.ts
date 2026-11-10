import type { Booking } from '@/api/bookings'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { durationShort, relativeDayLabel, todayIso } from '@/lib/dates'
import { initials } from '@/lib/format'
import { useBusinessDataStore } from '@/stores/business-data-store'
import { PAYMENT_LABELS, PAYMENT_STYLES, clientColor } from '../utils'

/** What one booking row displays. */
export function useBookingRow(booking: Booking) {
  const money = useFormatMoney()
  const businessName = useBusinessDataStore(state => state.businessData?.name) ?? ''
  const isRefund = booking.paymentStatus === 'REFUND_PENDING'
  return {
    time: booking.startTime,
    /** Today's rows show the duration, later ones the date (the design's second line). */
    secondary: booking.date === todayIso() ? durationShort(booking.durationMinutes) : relativeDayLabel(booking.date).replace(', ', ' · '),
    initials: initials(booking.customerName || '?'),
    color: clientColor(booking.customerName),
    businessName,
    price: money(isRefund ? booking.refundableAmount : booking.amount),
    paymentLabel: PAYMENT_LABELS[booking.paymentStatus] ?? booking.paymentStatus,
    paymentClassName: PAYMENT_STYLES[booking.paymentStatus] ?? 'text-[#657C71]',
  }
}
