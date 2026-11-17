import { useMemo, useState } from 'react'
import { useAttendants } from '@/api/attendants'
import { useServiceHistorySummary } from '@/api/bookings'
import { useAllServices } from '@/api/services'
import type { DateRange } from '@/components/ui/DateRangeFilter'
import { useFormatMoney, useFormatMoneyCompact } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { toIsoDate } from '@/lib/dates'

export const HISTORY_PAGE_SIZE = 10
const ALL = ''

/** The backend's counting rule (history-summary), shown under the stat cards. */
export const HISTORY_RULE = 'Booked counts every booking except cancelled ones. Revenue is the amount paid on completed bookings.'

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
 * Services → Service history, from GET service/bookings/business/{id}/history-summary/
 * ?start_date&end_date&staff_id&service_id: grouped by date + service on the server, and
 * re-requested whenever the range or a filter changes. Attendants are fixed on themselves.
 */
export function useServiceHistory() {
  const money = useFormatMoney()
  const moneyCompact = useFormatMoneyCompact()
  const [range, setRangeState] = useState<DateRange | undefined>(thisMonth)
  const { staffScopeId, isAttendant } = usePermissions()
  const [attendantChoice, setAttendantState] = useState(ALL)
  const attendant = isAttendant ? staffScopeId : attendantChoice
  const [service, setServiceState] = useState(ALL)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(HISTORY_PAGE_SIZE)

  // A cleared range falls back to this month.
  const effective = range?.from ? range : thisMonth()
  const startDate = toIsoDate(effective.from as Date)
  const endDate = toIsoDate(effective.to ?? (effective.from as Date))
  const query = useServiceHistorySummary({ startDate, endDate, staffId: attendant, serviceId: service })
  const team = useAttendants()
  const services = useAllServices()

  const attendantOptions = useMemo(() => {
    const people = (team.data ?? []).map(person => ({ value: person.id, label: person.name }))
    if (isAttendant) return [{ value: staffScopeId, label: people.find(person => person.value === staffScopeId)?.label ?? 'My bookings' }]
    return [{ value: ALL, label: 'All attendants' }, ...people.sort((a, b) => a.label.localeCompare(b.label))]
  }, [team.data, isAttendant, staffScopeId])

  const serviceOptions = useMemo(() => {
    const list = (services.data?.services ?? []).map(item => ({ value: item.id, label: item.name }))
    return [{ value: ALL, label: 'All services' }, ...list.sort((a, b) => a.label.localeCompare(b.label))]
  }, [services.data])

  const rows = useMemo<HistoryRow[]>(() => (query.data ?? [])
    .map(row => ({ key: `${row.date}|${row.serviceId}`, date: row.date, dateLabel: dateLabel(row.date), serviceName: row.serviceName || 'Service', count: row.count, revenue: row.revenue, revenueLabel: money(row.revenue) }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.serviceName.localeCompare(b.serviceName)), [query.data, money])

  const totalBooked = rows.reduce((sum, row) => sum + row.count, 0)
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const attendantName = attendantOptions.find(option => option.value === attendant)?.label

  return {
    range,
    setRange: (next: DateRange | undefined) => { setRangeState(next); setPage(1) },
    attendant,
    attendantOptions,
    setAttendant: (next: string) => { setAttendantState(next); setPage(1) },
    /** Attendants only see their own history. */
    attendantLocked: isAttendant,
    service,
    serviceOptions,
    setService: (next: string) => { setServiceState(next); setPage(1) },
    isFiltered: (!isAttendant && attendant !== ALL) || service !== ALL,
    clearFilters: () => { setAttendantState(ALL); setServiceState(ALL); setPage(1) },
    stats: {
      booked: String(totalBooked),
      revenue: moneyCompact(totalRevenue),
      scope: isAttendant ? 'By you' : attendant !== ALL && attendantName ? `By ${attendantName}` : undefined,
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
