import { CalendarCheck, CheckCircle2, Clock3, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { defaultBookingsRange, useDefaultBookings, useFetchAllBookings, usePagedBookings, type BookingsQuery, type BookingStatus, type RefundFilter } from '@/api/bookings'
import type { DateRange } from '@/components/ui/DateRangeFilter'
import { useDebounce } from '@/hooks/useDebounce'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useFormatMoney, useFormatMoneyCompact } from '@/hooks/useFormatMoney'
import { downloadCsv } from '@/lib/csv'
import { fromIsoDate, todayIso, toIsoDate } from '@/lib/dates'
import { BOOKING_STATUS_FILTERS, BOOKINGS_PAGE_SIZE, BOOKINGS_PAGE_SIZES, type BookingsTab } from '../constants'
import { isUpcoming, STATUS_LABELS } from '../utils'
import { useBookingActions } from './useBookingActions'

const SEARCH_DEBOUNCE_MS = 400

/**
 * Bookings screen. The list is paged, filtered and searched on the server
 * (page, limit, status, payment_status, search); the stat cards read the shared
 * unpaged window that the overview and sidebar use.
 */
export function useBookingsPage() {
  const money = useFormatMoney()
  const moneyCompact = useFormatMoneyCompact()
  const { openNewBooking, openBooking } = useBookingActions()
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

  const isRefunds = tab === 'Refunds'
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
  const statsQuery = useDefaultBookings()
  const windowBookings = useMemo(() => statsQuery.data?.bookings ?? [], [statsQuery.data])
  const pagination = list.data?.pagination
  const totalPages = pagination?.totalPages ?? 1

  const reset = () => setPage(1)
  const setTab = (next: BookingsTab) => { setTabState(next); reset() }
  const setStatus = (next: BookingStatus | '') => { setStatusState(next); reset() }

  const stats = useMemo(() => {
    const confirmed = windowBookings.filter(booking => booking.status === 'CONFIRMED')
    const unpaid = windowBookings.filter(booking => booking.balanceDue > 0 && booking.status !== 'CANCELLED')
    const show = (next: { tab?: BookingsTab; status?: BookingStatus | ''; payment?: string }) => () => {
      setTabState(next.tab ?? 'All')
      setStatusState(next.status ?? '')
      setPaymentFilter(next.payment ?? '')
      setPage(1)
    }
    return [
      { label: 'Upcoming', value: String(windowBookings.filter(booking => isUpcoming(booking)).length).padStart(2, '0'), note: 'Next 30 days', icon: CalendarCheck, color: 'bg-[#D8FF72]', onClick: show({ tab: 'Upcoming' }) },
      { label: 'Confirmed', value: String(confirmed.length).padStart(2, '0'), note: `${money(confirmed.reduce((sum, booking) => sum + booking.amount, 0))} booked`, icon: CheckCircle2, color: 'bg-[#CDEEDC]', onClick: show({ status: 'CONFIRMED' }) },
      { label: 'Needs approval', value: String(windowBookings.filter(booking => booking.status === 'PENDING').length).padStart(2, '0'), note: 'Review pending requests', icon: Clock3, color: 'bg-[#FFE1AD]', onClick: show({ status: 'PENDING' }) },
      { label: 'Unpaid balance', value: moneyCompact(unpaid.reduce((sum, booking) => sum + booking.balanceDue, 0)), note: `Across ${unpaid.length} ${unpaid.length === 1 ? 'booking' : 'bookings'}`, icon: Wallet, color: 'bg-[#DED9FF]', onClick: show({ payment: 'UNPAID' }) },
    ]
  }, [windowBookings, money, moneyCompact])

  const summary = list.data?.summary ?? statsQuery.data?.summary
  const pendingRefunds = summary?.pendingRefunds ?? 0
  const rows = list.data?.bookings ?? []
  const datesSet = range.startDate !== defaultBookingsRange().startDate || range.endDate !== defaultBookingsRange().endDate

  return {
    tab,
    setTab,
    stats,
    statsLoading: statsQuery.isLoading,
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
