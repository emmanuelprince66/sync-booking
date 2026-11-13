import { Banknote, CalendarCheck, CalendarDays, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { defaultBookingsRange, useBookings, useFetchAllBookings, usePagedBookings, type Booking, type BookingsQuery, type BookingStatus, type RefundFilter } from '@/api/bookings'
import type { StatTone } from '@/components/ui/ColorStatCard'
import type { DateRange } from '@/components/ui/DateRangeFilter'
import { useDebounce } from '@/hooks/useDebounce'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useFormatMoney, useFormatMoneyCompact } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { downloadCsv } from '@/lib/csv'
import { fromIsoDate, todayIso, toIsoDate } from '@/lib/dates'
import { BOOKING_STATUS_FILTERS, BOOKING_TABS, BOOKINGS_PAGE_SIZE, BOOKINGS_PAGE_SIZES, type BookingsTab } from '../constants'
import { isUpcoming, STATUS_LABELS } from '../utils'
import { useBookingActions } from './useBookingActions'

const SEARCH_DEBOUNCE_MS = 400

/** Money already taken on a booking and kept: refunded or refund-due payments don't count. */
const collectedOn = (booking: Booking) => (booking.paymentStatus === 'REFUNDED' || booking.paymentStatus === 'REFUND_PENDING' ? 0 : booking.amountPaid)

const plural = (count: number, word: string) => `${count} ${count === 1 ? word : `${word}s`}`

/**
 * Bookings screen. The list is paged, filtered and searched on the server
 * (page, limit, status, payment_status, search). The stat cards count every booking
 * in the selected dates (and search), read whole in one request, so they always add
 * up to what the list can show; clicking one narrows the list to it.
 * Attendants only get their own bookings (the bookings hooks narrow them) and no Refunds tab.
 */
export function useBookingsPage() {
  const money = useFormatMoney()
  const moneyCompact = useFormatMoneyCompact()
  const { openNewBooking, openBooking, canAddBooking } = useBookingActions()
  const { canManageBookings } = usePermissions()
  const [params] = useSearchParams()
  const [tab, setTabState] = useState<BookingsTab>('All')
  const [range, setRange] = useState(defaultBookingsRange)
  const [status, setStatusState] = useState<BookingStatus | ''>('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [searchOverride, setSearchInput] = useState<string | null>(null)
  const [refundFilter, setRefundFilterState] = useState<RefundFilter>('REFUND_PENDING')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState<number>(BOOKINGS_PAGE_SIZE)
  const [isExporting, setExporting] = useState(false)
  const filterMenu = useDisclosure()
  const fetchAll = useFetchAllBookings()
  // The top bar's search lands here as ?q=; typing in the filter takes over.
  const searchInput = searchOverride ?? params.get('q') ?? ''
  const search = useDebounce(searchInput.trim(), SEARCH_DEBOUNCE_MS)

  const isRefunds = tab === 'Refunds' && canManageBookings
  /** The filters without the page, shared by the list and the export. */
  const filters = useMemo<BookingsQuery>(() => {
    if (isRefunds) return { paymentStatus: refundFilter, search }
    const today = todayIso()
    // Upcoming starts today, whatever the range says; the end never falls before it.
    const dates = tab === 'Upcoming'
      ? { startDate: range.startDate > today ? range.startDate : today, endDate: range.endDate > today ? range.endDate : today }
      : range
    return { ...dates, status, paymentStatus: paymentFilter, search }
  }, [isRefunds, refundFilter, search, tab, range, status, paymentFilter])

  const list = usePagedBookings({ ...filters, page, limit: pageSize })
  // Same key as the shared default window when the dates and search are untouched, so no extra request.
  const statsQuery = useBookings({ startDate: range.startDate, endDate: range.endDate, search })
  const windowBookings = useMemo(() => statsQuery.data?.bookings ?? [], [statsQuery.data])
  const pagination = list.data?.pagination
  const totalPages = pagination?.totalPages ?? 1

  const reset = () => setPage(1)
  const setTab = (next: BookingsTab) => { setTabState(next); reset() }
  const setStatus = (next: BookingStatus | '') => { setStatusState(next); reset() }

  const stats = useMemo(() => {
    const live = windowBookings.filter(booking => booking.status !== 'CANCELLED')
    const completed = live.filter(booking => booking.status === 'COMPLETED')
    const upcoming = windowBookings.filter(booking => isUpcoming(booking))
    const awaiting = upcoming.filter(booking => booking.status === 'PENDING')
    const paid = windowBookings.filter(booking => collectedOn(booking) > 0)
    const fullyPaid = paid.filter(booking => booking.paymentStatus === 'PAID')
    const unpaid = live.filter(booking => booking.balanceDue > 0)
    const show = (next: { tab?: BookingsTab; status?: BookingStatus | ''; payment?: string }) => () => {
      setTabState(next.tab ?? 'All')
      setStatusState(next.status ?? '')
      setPaymentFilter(next.payment ?? '')
      setPage(1)
    }
    const isShowing = (next: { tab?: BookingsTab; status?: BookingStatus | ''; payment?: string }) =>
      tab === (next.tab ?? 'All') && status === (next.status ?? '') && paymentFilter === (next.payment ?? '')
    const card = (label: string, value: string, note: string, icon: typeof Wallet, tone: StatTone, filter: { tab?: BookingsTab; status?: BookingStatus | ''; payment?: string } | null) =>
      ({ label, value, note, icon, tone, onClick: filter ? show(filter) : show({}), active: filter ? isShowing(filter) : false })
    return [
      card('Bookings', String(live.length), `${completed.length} completed`, CalendarDays, 'lime', null),
      card('Upcoming', String(upcoming.length), awaiting.length ? `${awaiting.length} awaiting approval` : 'All confirmed', CalendarCheck, 'mint', { tab: 'Upcoming' }),
      card('Collected', moneyCompact(paid.reduce((sum, booking) => sum + collectedOn(booking), 0)), `${plural(fullyPaid.length, 'booking')} paid in full`, Banknote, 'peach', { payment: 'PAID' }),
      card('Balance due', moneyCompact(unpaid.reduce((sum, booking) => sum + booking.balanceDue, 0)), `Across ${plural(unpaid.length, 'booking')}`, Wallet, 'lilac', { payment: 'UNPAID' }),
    ]
  }, [windowBookings, moneyCompact, tab, status, paymentFilter])

  const summary = list.data?.summary ?? statsQuery.data?.summary
  const pendingRefunds = summary?.pendingRefunds ?? 0
  const rows = list.data?.bookings ?? []
  const datesSet = range.startDate !== defaultBookingsRange().startDate || range.endDate !== defaultBookingsRange().endDate

  return {
    tab,
    setTab,
    tabs: canManageBookings ? BOOKING_TABS : BOOKING_TABS.filter(option => option.value !== 'Refunds'),
    stats,
    statsLoading: statsQuery.isLoading,
    statsNote: datesSet ? 'In the selected dates' : 'This week and the next 30 days',
    rows,
    page: Math.min(page, totalPages),
    totalPages,
    setPage,
    pageSize,
    pageSizeOptions: BOOKINGS_PAGE_SIZES,
    setPageSize: (size: number) => { setPageSizeState(size); reset() },
    isLoading: list.isLoading,
    isFetching: list.isFetching && !list.isLoading,
    isError: list.isError,
    retry: () => void list.refetch(),
    isEmpty: !list.isLoading && rows.length === 0,
    isFiltered: Boolean(search || paymentFilter || status || datesSet),
    isRefunds,
    refundFilter,
    setRefundFilter: (value: RefundFilter) => { setRefundFilterState(value); reset() },
    pendingRefundsLabel: pendingRefunds ? `${pendingRefunds} pending · ${money(summary?.pendingRefundsAmount ?? 0)}` : '',
    status,
    statusOptions: BOOKING_STATUS_FILTERS,
    setStatus: (value: string) => setStatus(value as BookingStatus | ''),
    filter: {
      isOpen: filterMenu.isOpen,
      toggle: filterMenu.toggle,
      close: filterMenu.close,
      search: searchInput,
      setSearch: (value: string) => { setSearchInput(value); reset() },
      /** Empty while the list is on its default window, so the filter reads as not set. */
      dates: (datesSet ? { from: fromIsoDate(range.startDate), to: fromIsoDate(range.endDate) } : undefined) as DateRange | undefined,
      /** Clearing goes back to the default window, since the list always reads a date window. */
      setDates: (next: DateRange | undefined) => {
        setRange(next?.from ? { startDate: toIsoDate(next.from), endDate: toIsoDate(next.to ?? next.from) } : defaultBookingsRange())
        reset()
      },
      payment: paymentFilter,
      setPayment: (value: string) => { setPaymentFilter(value); reset() },
      clear: () => { setSearchInput(''); setPaymentFilter(''); setStatusState(''); setRange(defaultBookingsRange()); reset() },
      isActive: Boolean(searchInput || paymentFilter),
    },
    openNewBooking,
    canAddBooking,
    openBooking,
    isExporting,
    exportCsv: async () => {
      setExporting(true)
      try {
        const { bookings } = await fetchAll(filters)
        downloadCsv(
          isRefunds ? 'refunds.csv' : `bookings-${filters.startDate}-to-${filters.endDate}.csv`,
          ['Reference', 'Date', 'Time', 'Client', 'Phone', 'Service', 'Attendee', 'Status', 'Payment', 'Amount', 'Paid', 'Balance'],
          bookings.map(booking => [booking.reference, booking.date, booking.startTime, booking.customerName, booking.customerPhone, booking.serviceName, booking.staffName, STATUS_LABELS[booking.status] ?? booking.status, booking.paymentStatus, booking.amount, booking.amountPaid, booking.balanceDue]),
        )
      } catch (error) {
        toast.error(errorMessage(error, 'Could not export bookings.'))
      } finally {
        setExporting(false)
      }
    },
  }
}

export type BookingsPageModel = ReturnType<typeof useBookingsPage>
