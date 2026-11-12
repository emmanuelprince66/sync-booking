import { useMemo, useState } from 'react'
import { useAttendants } from '@/api/attendants'
import { useBookings, type Booking } from '@/api/bookings'
import type { DateRange } from '@/components/ui/DateRangeFilter'
import { useFormatMoney, useFormatMoneyCompact } from '@/hooks/useFormatMoney'
import { toIsoDate } from '@/lib/dates'

export const HISTORY_PAGE_SIZE = 10
const ALL = ''

/**
 * Counting rule (shown under the stat cards):
 * - "Booked": every booking in the range except cancelled and no-show ones.
 * - "Revenue": the amount actually paid on booked bookings that are completed or fully paid;
 *   refunded / refund-pending bookings add nothing.
 */
const isBooked = (booking: Booking) => booking.status !== 'CANCELLED' && booking.status !== 'NO_SHOW'
const revenueOf = (booking: Booking) => {
  if (booking.paymentStatus === 'REFUNDED' || booking.paymentStatus === 'REFUND_PENDING') return 0
  return booking.status === 'COMPLETED' || booking.paymentStatus === 'PAID' ? booking.amountPaid : 0
}
export const HISTORY_RULE = 'Booked counts every booking except cancelled and no-shows. Revenue is the amount paid on completed or fully paid bookings; refunds are left out.'

const thisMonth = (): DateRange => {
  const today = new Date()
  return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: new Date(today.getFullYear(), today.getMonth() + 1, 0) }
}

export type HistoryRow = { key: string; date: string; dateLabel: string; serviceName: string; count: number; revenue: number; revenueLabel: string }

const dateLabel = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  return year ? new Date(year, month - 1, day).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'No date'
}

/**
 * Services → Service history. There is no history endpoint, so this reads the
 * bookings list for the range (GET service/bookings/business/{id}/?start_date&end_date,
 * whole range in one response) and groups it per date + service on the client.
 * The attendant and service filters match the booking's staff id / service id.
 */
export function useServiceHistory() {
  const money = useFormatMoney()
  const moneyCompact = useFormatMoneyCompact()
  const [range, setRangeState] = useState<DateRange | undefined>(thisMonth)
  const [attendant, setAttendantState] = useState(ALL)
  const [service, setServiceState] = useState(ALL)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(HISTORY_PAGE_SIZE)

  // A cleared range falls back to this month.
  const effective = range?.from ? range : thisMonth()
  const startDate = toIsoDate(effective.from as Date)
  const endDate = toIsoDate(effective.to ?? (effective.from as Date))
  const query = useBookings({ startDate, endDate })
  const team = useAttendants()

  const booked = useMemo(() => (query.data?.bookings ?? []).filter(isBooked), [query.data])

  const attendantOptions = useMemo(() => {
    const names = new Map<string, string>()
    for (const person of team.data ?? []) names.set(person.id, person.name)
    for (const booking of booked) if (booking.staffId && !names.has(booking.staffId)) names.set(booking.staffId, booking.staffName || 'Staff member')
    return [{ value: ALL, label: 'All attendants' }, ...[...names].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label))]
  }, [team.data, booked])

  const serviceOptions = useMemo(() => {
    const names = new Map<string, string>()
    for (const booking of booked) names.set(booking.serviceId || booking.serviceName, booking.serviceName || 'Service')
    return [{ value: ALL, label: 'All services' }, ...[...names].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label))]
  }, [booked])

  const filtered = useMemo(() => booked.filter(booking =>
    (attendant === ALL || booking.staffId === attendant)
    && (service === ALL || (booking.serviceId || booking.serviceName) === service)), [booked, attendant, service])

  const rows = useMemo<HistoryRow[]>(() => {
    const groups = new Map<string, HistoryRow>()
    for (const booking of filtered) {
      const serviceKey = booking.serviceId || booking.serviceName
      const key = `${booking.date}|${serviceKey}`
      const row = groups.get(key) ?? { key, date: booking.date, dateLabel: dateLabel(booking.date), serviceName: booking.serviceName || 'Service', count: 0, revenue: 0, revenueLabel: '' }
      row.count += 1
      row.revenue += revenueOf(booking)
      groups.set(key, row)
    }
    return [...groups.values()]
      .map(row => ({ ...row, revenueLabel: money(row.revenue) }))
      .sort((a, b) => b.date.localeCompare(a.date) || a.serviceName.localeCompare(b.serviceName))
  }, [filtered, money])

  const totalRevenue = filtered.reduce((sum, booking) => sum + revenueOf(booking), 0)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const attendantName = attendantOptions.find(option => option.value === attendant)?.label

  return {
    range,
    setRange: (next: DateRange | undefined) => { setRangeState(next); setPage(1) },
    attendant,
    attendantOptions,
    setAttendant: (next: string) => { setAttendantState(next); setPage(1) },
    service,
    serviceOptions,
    setService: (next: string) => { setServiceState(next); setPage(1) },
    isFiltered: attendant !== ALL || service !== ALL,
    clearFilters: () => { setAttendantState(ALL); setServiceState(ALL); setPage(1) },
    stats: {
      booked: String(filtered.length),
      revenue: moneyCompact(totalRevenue),
      scope: attendant !== ALL && attendantName ? `By ${attendantName}` : undefined,
    },
    rule: HISTORY_RULE,
    rows: rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    hasRows: rows.length > 0,
    page: currentPage,
    totalPages,
    setPage,
    pageSize,
    setPageSize: (size: number) => { setPageSizeState(size); setPage(1) },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    retry: () => void query.refetch(),
  }
}
