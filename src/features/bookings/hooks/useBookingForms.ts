import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { useAttendants } from '@/api/attendants'
import { errorMessage } from '@/api/auth'
import { maskedAccount, useSettlementAccounts } from '@/api/banks'
import { useCancelBooking, useCheckoutBooking, useDisburseRefund, useUpdateBooking, type Booking } from '@/api/bookings'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { timeSelectOptions } from '@/lib/dates'
import {
  cancelSchema, checkoutSchema, reassignSchema, refundSchema, rescheduleSchema,
  type CancelValues, type CheckoutValues, type ReassignValues, type RefundValues, type RescheduleValues,
} from '../schemas'

/** "Take payment" (POST checkout), sink's rules: never above the balance; transfers name the receiving account. */
export function useCheckoutForm(booking: Booking, onClose: () => void) {
  const money = useFormatMoney()
  const checkout = useCheckoutBooking()
  const banks = useSettlementAccounts()
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema(booking.balanceDue)),
    defaultValues: { amount: String(booking.balanceDue), method: 'CASH', bankId: '' },
  })
  const method = useWatch({ control: form.control, name: 'method' })
  return {
    register: form.register,
    errors: form.formState.errors,
    balance: money(booking.balanceDue),
    method,
    setMethod: (value: CheckoutValues['method']) => form.setValue('method', value),
    bankOptions: (banks.data ?? []).map(account => ({ value: account.id, label: maskedAccount(account) })),
    isSubmitting: checkout.isPending,
    onSubmit: form.handleSubmit(async values => {
      try {
        await checkout.mutateAsync({ id: booking.id, amount: Number(values.amount), method: values.method, bankId: values.bankId || null })
        toast.success(`Payment of ${money(Number(values.amount))} recorded`)
        onClose()
      } catch (error) {
        toast.error(errorMessage(error, 'Could not record payment.'))
      }
    }),
  }
}

/** PATCH { new_date, new_start_time }. */
export function useRescheduleForm(booking: Booking, onClose: () => void) {
  const update = useUpdateBooking()
  const form = useForm<RescheduleValues>({ resolver: zodResolver(rescheduleSchema), defaultValues: { date: booking.date, time: booking.startTime } })
  return {
    control: form.control,
    timeOptions: timeSelectOptions(booking.startTime),
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: update.isPending,
    onSubmit: form.handleSubmit(async values => {
      try {
        await update.mutateAsync({ id: booking.id, patch: { newDate: values.date, newStartTime: values.time } })
        toast.success('Booking rescheduled')
        onClose()
      } catch (error) {
        toast.error(errorMessage(error, 'Could not reschedule booking.'))
      }
    }),
  }
}

/** POST cancel { reason }. */
export function useCancelForm(booking: Booking, onClose: () => void) {
  const cancel = useCancelBooking()
  const form = useForm<CancelValues>({ resolver: zodResolver(cancelSchema), defaultValues: { reason: '' } })
  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: cancel.isPending,
    onSubmit: form.handleSubmit(async values => {
      try {
        await cancel.mutateAsync({ id: booking.id, reason: values.reason })
        toast.success('Booking cancelled')
        onClose()
      } catch (error) {
        toast.error(errorMessage(error, 'Could not cancel booking.'))
      }
    }),
  }
}

/** POST disburse-refund: records that the merchant has paid the client back. */
export function useRefundForm(booking: Booking, onClose: () => void) {
  const money = useFormatMoney()
  const disburse = useDisburseRefund()
  const form = useForm<RefundValues>({ resolver: zodResolver(refundSchema), defaultValues: { method: 'BANK_TRANSFER', reference: '', notes: '' } })
  const method = useWatch({ control: form.control, name: 'method' })
  return {
    register: form.register,
    amount: money(booking.refundableAmount),
    method,
    setMethod: (value: RefundValues['method']) => form.setValue('method', value),
    isSubmitting: disburse.isPending,
    onSubmit: form.handleSubmit(async values => {
      try {
        await disburse.mutateAsync({ id: booking.id, method: values.method, reference: values.reference.trim(), notes: values.notes.trim() })
        toast.success('Refund recorded as disbursed')
        onClose()
      } catch (error) {
        toast.error(errorMessage(error, 'Could not record refund.'))
      }
    }),
  }
}

/** PATCH { staff_id }. */
export function useReassignForm(booking: Booking, onClose: () => void) {
  const update = useUpdateBooking()
  const attendants = useAttendants()
  const form = useForm<ReassignValues>({ resolver: zodResolver(reassignSchema), defaultValues: { staffId: booking.staffId } })
  const list = useMemo(() => attendants.data ?? [], [attendants.data])
  return {
    register: form.register,
    errors: form.formState.errors,
    options: list.map(attendant => ({ value: attendant.id, label: attendant.name })),
    isLoading: attendants.isLoading,
    isSubmitting: update.isPending,
    onSubmit: form.handleSubmit(async values => {
      const staffName = list.find(attendant => attendant.id === values.staffId)?.name ?? ''
      try {
        await update.mutateAsync({ id: booking.id, patch: { staffId: values.staffId, staffName } })
        toast.success(staffName ? `Reassigned to ${staffName}` : 'Attendee reassigned')
        onClose()
      } catch (error) {
        toast.error(errorMessage(error, 'Could not reassign this booking.'))
      }
    }),
  }
}
