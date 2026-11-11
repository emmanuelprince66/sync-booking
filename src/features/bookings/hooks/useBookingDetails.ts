import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useBooking, useUpdateBooking } from '@/api/bookings'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { durationShort, relativeDayLabel } from '@/lib/dates'
import { initials } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'
import { useUiStore } from '@/stores/ui-store'
import { serviceInitialsColor } from '../utils'

export type BookingDialog = 'checkout' | 'reschedule' | 'cancel' | 'refund' | 'reassign' | null

const humanizeOption = (option: string) => ({ FULL_PAYMENT: 'Online · Full payment', DEPOSIT: 'Online · Deposit', PAY_AT_BUSINESS: 'Pay at venue' } as Record<string, string>)[option] ?? ''

/** Booking details drawer: the booking, its permissions (sink's role rules) and its actions. */
export function useBookingDetails() {
  const id = useUiStore(state => state.selectedBookingId)
  const setId = useUiStore(state => state.setSelectedBookingId)
  const role = useAuthStore(state => state.user?.role)
  const money = useFormatMoney()
  const query = useBooking(id)
  const update = useUpdateBooking()
  const [dialog, setDialog] = useState<BookingDialog>(null)

  const booking = query.data ?? null
  const canManageSettings = !role || role === 'OWNER' || role === 'ADMIN-ATTENDANT'
  const canUpdateProgress = canManageSettings || role === 'ATTENDANT'
  const canManage = Boolean(booking) && booking?.status !== 'CANCELLED' && booking?.status !== 'COMPLETED'
  const inProgress = booking?.status === 'IN_PROGRESS'
  const hasBalance = (booking?.balanceDue ?? 0) > 0
  const isRefundPending = booking?.paymentStatus === 'REFUND_PENDING'
  const isRefunded = booking?.paymentStatus === 'REFUNDED'
  const isForfeited = booking?.paymentStatus === 'DEPOSIT_FORFEITED'
  const isSettled = !hasBalance && !isRefundPending && !isRefunded && !isForfeited

  const setStatus = async (status: 'IN_PROGRESS' | 'COMPLETED') => {
    if (!booking) return
    try {
      await update.mutateAsync({ id: booking.id, patch: { status } })
      toast.success(status === 'COMPLETED' ? 'Booking marked completed' : `${booking.customerName} checked in`)
    } catch (error) {
      toast.error(errorMessage(error, 'Could not update booking.'))
    }
  }

  return {
    open: Boolean(id),
    close: () => setId(null),
    isLoading: query.isLoading,
    isError: query.isError,
    retry: query.refetch,
    booking,
    view: booking && {
      dateLabel: relativeDayLabel(booking.date),
      duration: durationShort(booking.durationMinutes),
      price: money(booking.amount),
      serviceInitials: initials(booking.serviceName || '?'),
      serviceColor: serviceInitialsColor(booking.serviceName),
      staffName: booking.staffName || 'Unassigned',
      staffInitials: booking.staffName ? initials(booking.staffName) : '—',
      staffNote: booking.staffName ? 'Assigned specialist' : 'Not assigned yet',
      payment: {
        tone: isSettled || isRefunded ? 'good' as const : 'due' as const,
        title: isRefundPending ? `${money(booking.refundableAmount)} refund due`
          : isRefunded ? 'Refund completed'
          : isForfeited ? `${money(booking.amountPaid)} forfeited`
          : hasBalance ? `${money(booking.balanceDue)} due` : 'Paid in full',
        note: isRefundPending ? 'Owed back to the client'
          : hasBalance && booking.amountPaid > 0 ? `${money(booking.amountPaid)} paid so far`
          : hasBalance ? 'Collect at appointment'
          : humanizeOption(booking.paymentOption),
      },
      takePaymentLabel: `Take payment · ${money(booking.balanceDue)}`,
      refundLabel: `Disburse refund · ${money(booking.refundableAmount)}`,
      sourceLabel: booking.source === 'storefront' ? 'Booked online' : 'Added by staff',
    },
    canStart: canManage && canUpdateProgress && !inProgress,
    inProgress,
    canComplete: inProgress && canUpdateProgress,
    canTakePayment: canManage && canUpdateProgress && hasBalance && !isRefunded && !isForfeited,
    canDisburse: canManageSettings && isRefundPending,
    canManageBooking: canManage && canManageSettings,
    isUpdating: update.isPending,
    start: () => setStatus('IN_PROGRESS'),
    complete: () => setStatus('COMPLETED'),
    dialog,
    openDialog: setDialog,
    closeDialog: () => setDialog(null),
  }
}
