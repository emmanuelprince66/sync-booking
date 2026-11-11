import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { addDays, normalizeTime, startOfWeek, toIsoDate } from '@/lib/dates'
import { useBusinessScope } from './business'
import { asRecord, isLive, listFrom, num, str } from './http'
import { queryKeys } from './query-keys'
import { sample } from './sample-data'

/**
 * Service bookings, same backend as sink-inventory's api/bookings/service-bookings.ts:
 *  GET   service/bookings/business/{business_id}/?start_date&end_date&payment_status&status&search&page&limit
 *        → { summary, selected_date, schedule: Booking[], pagination: { count, page, limit, total_pages } | null }
 *        page/limit are opt-in: without them `schedule` is the whole range and pagination is null.
 *        summary always covers the whole range.
 *  POST  service/bookings/business/{business_id}/
 *  GET   service/bookings/{booking_id}/
 *  PATCH service/bookings/{booking_id}/              { status } or { new_date, new_start_time } or { staff_id } (null unassigns;
 *                                                    400 with a message when that attendee is busy or invalid)
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

export type BookingsQuery = {
  startDate?: string
  endDate?: string
  paymentStatus?: string
  status?: BookingStatus | ''
  /** Customer name, phone or reference. */
  search?: string
}

/** Opt-in server pages for the bookings list. */
export type BookingsPageQuery = BookingsQuery & { page: number; limit: number }
export type BookingsPagination = { count: number; page: number; limit: number; totalPages: number }
export type BookingsPageResult = BookingsResult & { pagination: BookingsPagination }

const bySchedule = (a: Booking, b: Booking) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)

const filterMockBookings = ({ startDate, endDate, paymentStatus, status, search }: BookingsQuery) => {
  const matchesPayment = (value: PaymentStatus) => !paymentStatus || (paymentStatus === 'REFUND' ? value === 'REFUND_PENDING' || value === 'REFUNDED' : value === paymentStatus)
  const term = search?.trim().toLowerCase() ?? ''
  const digits = term.replace(/\D/g, '')
  const matchesSearch = (item: Booking) => !term || item.customerName.toLowerCase().includes(term) || item.reference.toLowerCase().includes(term)
    || (digits.length > 0 && item.customerPhone.replace(/\D/g, '').includes(digits))
  return sample.bookings.filter(item => (!startDate || item.date >= startDate) && (!endDate || item.date <= endDate) && matchesPayment(item.paymentStatus)
    && (!status || item.status === status) && matchesSearch(item)).sort(bySchedule)
}

const mockSummary = (): BookingsSummary => {
  const pending = sample.bookings.filter(item => item.paymentStatus === 'REFUND_PENDING')
  return { pendingRefunds: pending.length, pendingRefundsAmount: pending.reduce((sum, item) => sum + item.refundableAmount, 0), unearnedRevenue: 0 }
}

const bookingsParams = (query: BookingsQuery) => {
  const params = new URLSearchParams()
  if (query.startDate) params.set('start_date', query.startDate)
  if (query.endDate) params.set('end_date', query.endDate)
  if (query.paymentStatus) params.set('payment_status', query.paymentStatus)
  if (query.status) params.set('status', query.status)
  if (query.search?.trim()) params.set('search', query.search.trim())
  return params
}

const mapSummary = (data: unknown): BookingsSummary => {
  const summary = asRecord(asRecord(data).summary)
  return { pendingRefunds: num(summary.pending_refunds), pendingRefundsAmount: num(summary.pending_refunds_amount), unearnedRevenue: num(summary.unearned_revenue) }
}

/** The whole range in one response: calendar, overview, client history and the sidebar count read this. */
const getBookings = async (businessId: string, query: BookingsQuery): Promise<BookingsResult> => {
  if (!isLive()) return mockDelay({ bookings: filterMockBookings(query), summary: mockSummary() })
  const data = payloadOf(await apiRequest<unknown>(`service/bookings/business/${businessId}/?${bookingsParams(query).toString()}`))
  return { bookings: listFrom(data, ['schedule', 'results', 'bookings']).map(mapBooking).sort(bySchedule), summary: mapSummary(data) }
}

/** One server page of bookings for the list screen; rows keep the server's order. */
const getBookingsPage = async (businessId: string, query: BookingsPageQuery): Promise<BookingsPageResult> => {
  if (!isLive()) {
    const all = filterMockBookings(query)
    return mockDelay({
      bookings: all.slice((query.page - 1) * query.limit, query.page * query.limit),
      summary: mockSummary(),
      pagination: { count: all.length, page: query.page, limit: query.limit, totalPages: Math.max(1, Math.ceil(all.length / query.limit)) },
    })
  }
  const params = bookingsParams(query)
  params.set('page', String(query.page))
  params.set('limit', String(query.limit))
  const data = payloadOf(await apiRequest<unknown>(`service/bookings/business/${businessId}/?${params.toString()}`))
  const bookings = listFrom(data, ['schedule', 'results', 'bookings']).map(mapBooking)
  const pagination = asRecord(asRecord(data).pagination)
  const count = num(pagination.count) || bookings.length
  return {
    bookings,
    summary: mapSummary(data),
    pagination: { count, page: num(pagination.page) || query.page, limit: num(pagination.limit) || query.limit, totalPages: num(pagination.total_pages) || Math.max(1, Math.ceil(count / query.limit)) },
  }
}

const listKey = (scope: string, query: BookingsQuery) =>
  [...queryKeys.bookings, scope, query.startDate ?? '', query.endDate ?? '', query.paymentStatus ?? '', query.status ?? '', query.search ?? '']

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
    queryKey: listKey(scope, query),
    queryFn: () => getBookings(scope, query),
    enabled: enabled && options.enabled !== false,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })
}

export const useDefaultBookings = () => useBookings(defaultBookingsRange())

/** Server-paged bookings for the list screen. Keyed under `bookings`, so every booking write refreshes it. */
export const usePagedBookings = (query: BookingsPageQuery) => {
  const { scope, enabled } = useBusinessScope()
  return useQuery({
    queryKey: [...queryKeys.bookings, scope, 'page', query],
    queryFn: () => getBookingsPage(scope, query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}

/** Every booking matching a filter in one go (no pages), for the CSV export. */
export const useFetchAllBookings = () => {
  const { scope } = useBusinessScope()
  const queryClient = useQueryClient()
  return (query: BookingsQuery) => queryClient.fetchQuery({ queryKey: listKey(scope, query), queryFn: () => getBookings(scope, query), staleTime: 30 * 1000 })
}

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
  // Sink's CreateBookingPage payload. Staff bookings are always pay-at-business: a "paid now"
  // booking is then settled with POST checkout/ (backend-confirmed flow).
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
      payment_option: 'PAY_AT_BUSINESS',
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
  /** staffId null unassigns the booking. */
  | { staffId: string | null; staffName: string }

const updateBooking = ({ id, patch }: { id: string; patch: BookingPatch }) => {
  if (!isLive()) {
    if ('status' in patch) return updateMockBooking(id, { status: patch.status })
    if ('newDate' in patch) return updateMockBooking(id, { date: patch.newDate, startTime: patch.newStartTime })
    return updateMockBooking(id, { staffId: patch.staffId ?? '', staffName: patch.staffId ? patch.staffName : '' })
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
