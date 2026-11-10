import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { addDays, normalizeTime, startOfWeek, toIsoDate } from '@/lib/dates'
import { useBusinessScope } from './business'
import { asRecord, isLive, listFrom, num, str } from './http'
import { queryKeys } from './query-keys'
import { sample } from './sample-data'

/**
 * Service bookings, same backend as sink-inventory's api/bookings/service-bookings.ts:
 *  GET   service/bookings/business/{business_id}/?start_date&end_date&payment_status
 *        → { summary, selected_date, schedule: Booking[] } (no server pagination)
 *  POST  service/bookings/business/{business_id}/
 *  GET   service/bookings/{booking_id}/
 *  PATCH service/bookings/{booking_id}/              { status } or { new_date, new_start_time } or { staff_id }
 *  POST  service/bookings/{booking_id}/cancel/        { reason }
 *  POST  service/bookings/{booking_id}/checkout/      { amount_received, method, bank_id }
 *  POST  service/bookings/{booking_id}/disburse-refund/ { disbursement_method, reference?, notes? }
 */

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED'
export type PaymentStatus = 'UNPAID' | 'DEPOSIT_PAID' | 'PAID' | 'REFUND_PENDING' | 'REFUNDED' | 'DEPOSIT_FORFEITED'
export type RefundFilter = 'REFUND_PENDING' | 'REFUNDED' | 'REFUND'
export type CheckoutMethod = 'CASH' | 'CARD' | 'TRANSFER'
export type RefundMethod = 'BANK_TRANSFER' | 'CASH'

export type Booking = {
  id: string
  reference: string
  /** yyyy-MM-dd */
  date: string
  /** HH:mm */
  startTime: string
  endTime: string
  durationMinutes: number
  customerId: string
  customerName: string
  customerPhone: string
  customerEmail: string
  serviceId: string
  serviceName: string
  staffId: string
  staffName: string
  amount: number
  amountPaid: number
  balanceDue: number
  refundableAmount: number
  paymentOption: string
  paymentStatus: PaymentStatus
  status: BookingStatus
  source: 'storefront' | 'staff'
  notes: string
  cancellationReason: string
}

export type BookingsSummary = { pendingRefunds: number; pendingRefundsAmount: number; unearnedRevenue: number }
export type BookingsResult = { bookings: Booking[]; summary: BookingsSummary }

/** The list endpoint nests under customer/service/staff or flattens to customer_name etc. depending on the view, so take either. */
export const mapBooking = (value: unknown): Booking => {
  const record = asRecord(value)
  const customer = asRecord(record.customer)
  const serviceRecord = asRecord(record.service)
  const staff = asRecord(record.staff)
  const startTime = normalizeTime(str(record.start_time) || str(record.time) || '00:00')
  const staffName = str(record.staff_name) || str(staff.name) || [str(staff.firstname), str(staff.lastname)].filter(Boolean).join(' ')
  return {
    id: str(record.id),
    reference: str(record.reference) || str(record.id),
    date: str(record.booking_date),
    startTime,
    endTime: normalizeTime(str(record.end_time)),
    durationMinutes: num(record.duration ?? record.duration_minutes ?? serviceRecord.duration),
    customerId: str(record.customer_id) || str(customer.id),
    customerName: str(record.customer_name) || str(customer.name),
    customerPhone: str(record.customer_phone) || str(customer.phone),
    customerEmail: str(record.customer_email) || str(customer.email),
    serviceId: str(record.service_id) || str(serviceRecord.id),
    serviceName: str(record.service_name) || str(serviceRecord.name),
    staffId: str(record.staff_id) || str(staff.id),
    staffName,
    amount: num(record.amount ?? record.service_price ?? serviceRecord.amount),
    amountPaid: num(record.amount_paid),
    balanceDue: num(record.balance_due),
    refundableAmount: num(record.refundable_amount ?? record.amount_paid),
    paymentOption: str(record.payment_option),
    paymentStatus: (str(record.payment_status) || 'UNPAID') as PaymentStatus,
    status: (str(record.booking_status) || str(record.status) || 'CONFIRMED') as BookingStatus,
    source: str(record.source) === 'storefront' ? 'storefront' : 'staff',
    notes: str(record.notes),
    cancellationReason: str(record.cancellation_reason),
  }
}

const payloadOf = (response: unknown) => {
  const record = asRecord(response)
  return record.data !== undefined ? record.data : response
}

export type BookingsQuery = { startDate?: string; endDate?: string; paymentStatus?: string }

const bySchedule = (a: Booking, b: Booking) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)

const getMockBookings = ({ startDate, endDate, paymentStatus }: BookingsQuery): Promise<BookingsResult> => {
  const matchesPayment = (status: PaymentStatus) => !paymentStatus || (paymentStatus === 'REFUND' ? status === 'REFUND_PENDING' || status === 'REFUNDED' : status === paymentStatus)
  const bookings = sample.bookings.filter(item => (!startDate || item.date >= startDate) && (!endDate || item.date <= endDate) && matchesPayment(item.paymentStatus)).sort(bySchedule)
  const pending = sample.bookings.filter(item => item.paymentStatus === 'REFUND_PENDING')
  return mockDelay({ bookings, summary: { pendingRefunds: pending.length, pendingRefundsAmount: pending.reduce((sum, item) => sum + item.refundableAmount, 0), unearnedRevenue: 0 } })
}

const getBookings = async (businessId: string, query: BookingsQuery): Promise<BookingsResult> => {
  if (!isLive()) return getMockBookings(query)
  const params = new URLSearchParams()
  if (query.startDate) params.set('start_date', query.startDate)
  if (query.endDate) params.set('end_date', query.endDate)
  if (query.paymentStatus) params.set('payment_status', query.paymentStatus)
  const data = payloadOf(await apiRequest<unknown>(`service/bookings/business/${businessId}/?${params.toString()}`))
  const summary = asRecord(asRecord(data).summary)
  return {
    bookings: listFrom(data, ['schedule', 'results', 'bookings']).map(mapBooking).sort(bySchedule),
    summary: { pendingRefunds: num(summary.pending_refunds), pendingRefundsAmount: num(summary.pending_refunds_amount), unearnedRevenue: num(summary.unearned_revenue) },
  }
}

/**
 * This week plus the next 30 days. Overview, the sidebar badge, services and the
 * bookings page all read this one range, so they share one request.
 */
export const defaultBookingsRange = () => {
  const today = new Date()
  return { startDate: toIsoDate(startOfWeek(today)), endDate: toIsoDate(addDays(today, 30)) }
}

export const useBookings = (query: BookingsQuery, options: { enabled?: boolean } = {}) => {
  const { scope, enabled } = useBusinessScope()
  return useQuery({
    queryKey: [...queryKeys.bookings, scope, query.startDate ?? '', query.endDate ?? '', query.paymentStatus ?? ''],
    queryFn: () => getBookings(scope, query),
    enabled: enabled && options.enabled !== false,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })
}

export const useDefaultBookings = () => useBookings(defaultBookingsRange())

const getBooking = async (id: string) => {
  if (!isLive()) return mockDelay(sample.bookings.find(item => item.id === id) ?? null, 300)
  const data = asRecord(payloadOf(await apiRequest<unknown>(`service/bookings/${id}/`)))
  return data.id ? mapBooking(data) : null
}

export const useBooking = (id: string | null) =>
  useQuery({ queryKey: [...queryKeys.booking, id], queryFn: () => getBooking(id as string), enabled: Boolean(id), staleTime: 30 * 1000 })

// ─── Writes ─────────────────────────────────────────────────────────────────

export type CreateBookingInput = {
  serviceId: string
  serviceName: string
  customerId: string
  customerName: string
  customerPhone: string
  customerEmail: string
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
  price: number
  staffId: string
  staffName: string
  notes: string
}

const createBooking = async (businessId: string, input: CreateBookingInput): Promise<string> => {
  if (!isLive()) {
    const id = `sample-booking-${Date.now()}`
    sample.bookings = [...sample.bookings, {
      id, reference: `CB-${String(Date.now()).slice(-5)}`, date: input.date, startTime: input.startTime, endTime: input.endTime, durationMinutes: input.durationMinutes,
      customerId: input.customerId, customerName: input.customerName, customerPhone: input.customerPhone, customerEmail: input.customerEmail,
      serviceId: input.serviceId, serviceName: input.serviceName, staffId: input.staffId, staffName: input.staffName,
      amount: input.price, amountPaid: 0, balanceDue: input.price, refundableAmount: 0, paymentOption: 'PAY_AT_BUSINESS', paymentStatus: 'UNPAID', status: 'CONFIRMED', source: 'staff', notes: input.notes, cancellationReason: '',
    }]
    return mockDelay(id, 500)
  }
  // Payload exactly as sink's CreateBookingPage sends it.
  const response = await apiRequest<unknown>(`service/bookings/business/${businessId}/`, {
    method: 'POST',
    body: {
      reference: `BK-${Date.now()}`,
      service_id: input.serviceId,
      customer_id: input.customerId,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_email: input.customerEmail,
      booking_date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      duration_minutes: input.durationMinutes,
      service_price: input.price.toFixed(2),
      staff_id: input.staffId,
      notes: input.notes,
    },
  })
  const data = asRecord(payloadOf(response))
  return str(asRecord(data.booking).id) || str(data.id)
}

const updateMockBooking = (id: string, patch: Partial<Booking>) => {
  sample.bookings = sample.bookings.map(item => (item.id === id ? { ...item, ...patch } : item))
  return mockDelay(null, 400)
}

export type BookingPatch =
  | { status: 'IN_PROGRESS' | 'COMPLETED' }
  | { newDate: string; newStartTime: string }
  | { staffId: string; staffName: string }

const updateBooking = ({ id, patch }: { id: string; patch: BookingPatch }) => {
  if (!isLive()) {
    if ('status' in patch) return updateMockBooking(id, { status: patch.status })
    if ('newDate' in patch) return updateMockBooking(id, { date: patch.newDate, startTime: patch.newStartTime })
    return updateMockBooking(id, { staffId: patch.staffId, staffName: patch.staffName })
  }
  const body = 'status' in patch ? { status: patch.status } : 'newDate' in patch ? { new_date: patch.newDate, new_start_time: patch.newStartTime } : { staff_id: patch.staffId }
  return apiRequest<unknown>(`service/bookings/${id}/`, { method: 'PATCH', body })
}

const cancelBooking = ({ id, reason }: { id: string; reason: string }) => {
  if (!isLive()) {
    const current = sample.bookings.find(item => item.id === id)
    const refundable = current?.amountPaid ?? 0
    return updateMockBooking(id, { status: 'CANCELLED', cancellationReason: reason, ...(refundable > 0 ? { paymentStatus: 'REFUND_PENDING' as const, refundableAmount: refundable, balanceDue: 0 } : {}) })
  }
  return apiRequest<unknown>(`service/bookings/${id}/cancel/`, { method: 'POST', body: { reason } })
}

export type CheckoutInput = { id: string; amount: number; method: CheckoutMethod; bankId: string | null }

const checkoutBooking = ({ id, amount, method, bankId }: CheckoutInput) => {
  if (!isLive()) {
    const current = sample.bookings.find(item => item.id === id)
    const balanceDue = Math.max(0, (current?.balanceDue ?? 0) - amount)
    return updateMockBooking(id, { amountPaid: (current?.amountPaid ?? 0) + amount, balanceDue, paymentStatus: balanceDue === 0 ? 'PAID' : 'DEPOSIT_PAID' })
  }
  return apiRequest<unknown>(`service/bookings/${id}/checkout/`, { method: 'POST', body: { amount_received: amount.toFixed(2), method, bank_id: method === 'TRANSFER' ? bankId : null } })
}

export type DisburseInput = { id: string; method: RefundMethod; reference?: string; notes?: string }

const disburseRefund = ({ id, method, reference, notes }: DisburseInput) => {
  if (!isLive()) return updateMockBooking(id, { paymentStatus: 'REFUNDED', refundableAmount: 0 })
  return apiRequest<unknown>(`service/bookings/${id}/disburse-refund/`, { method: 'POST', body: { disbursement_method: method, reference: reference || undefined, notes: notes || undefined } })
}

const useInvalidateBookings = () => {
  const queryClient = useQueryClient()
  return () => Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings }),
    queryClient.invalidateQueries({ queryKey: queryKeys.booking }),
  ])
}

export const useCreateBooking = () => {
  const { scope } = useBusinessScope()
  const invalidate = useInvalidateBookings()
  return useMutation({ mutationFn: (input: CreateBookingInput) => createBooking(scope, input), onSuccess: invalidate })
}

export const useUpdateBooking = () => useMutation({ mutationFn: updateBooking, onSuccess: useInvalidateBookings() })
export const useCancelBooking = () => useMutation({ mutationFn: cancelBooking, onSuccess: useInvalidateBookings() })
export const useCheckoutBooking = () => useMutation({ mutationFn: checkoutBooking, onSuccess: useInvalidateBookings() })
export const useDisburseRefund = () => useMutation({ mutationFn: disburseRefund, onSuccess: useInvalidateBookings() })
