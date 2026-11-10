import { CalendarCheck, CheckCircle2, Clock3, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { defaultBookingsRange, useBookings, type Booking } from '@/api/bookings'
import type { DateRange } from '@/components/ui/DateRangeFilter'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useFormatMoney, useFormatMoneyCompact } from '@/hooks/useFormatMoney'
import { downloadCsv } from '@/lib/csv'
import { fromIsoDate, toIsoDate } from '@/lib/dates'
import { BOOKINGS_PAGE_SIZE, type BookingsTab } from '../constants'
import { isUpcoming, STATUS_LABELS } from '../utils'
import { useBookingActions } from './useBookingActions'

const matchesTab = (booking: Booking, tab: BookingsTab) => {
  if (tab === 'Upcoming') return isUpcoming(booking)
  if (tab === 'Confirmed') return booking.status === 'CONFIRMED'
  if (tab === 'Pending') return booking.status === 'PENDING'
  if (tab === 'Completed') return booking.status === 'COMPLETED'
  return true
}

/**
 * Bookings screen. The list endpoint has no server pagination (only a date range),
 * so pages are cut on the client, as sink's useBookings does.
 */
export function useBookingsPage() {
  const money = useFormatMoney()
  const moneyCompact = useFormatMoneyCompact()
  const { openNewBooking, openBooking } = useBookingActions()
  const [params] = useSearchParams()
  const [tab, setTabState] = useState<BookingsTab>('All')
  const [range, setRange] = useState(defaultBookingsRange)
  const [paymentFilter, setPaymentFilter] = useState('')
  const [searchOverride, setSearch] = useState<string | null>(null)
  const [refundFilter, setRefundFilter] = useState<'REFUND_PENDING' | 'REFUNDED' | 'REFUND'>('REFUND_PENDING')
  const [page, setPage] = useState(1)
  const filterMenu = useDisclosure()
  // The top bar's search lands here as ?q=; typing in the filter takes over.
  const search = searchOverride ?? params.get('q') ?? ''

  const isRefunds = tab === 'Refunds'
  const query = useBookings(range)
  const refundsQuery = useBookings({ paymentStatus: refundFilter }, { enabled: isRefunds })
  const all = useMemo(() => query.data?.bookings ?? [], [query.data])

  const visible = useMemo(() => {
    const source = isRefunds ? refundsQuery.data?.bookings ?? [] : all
    const term = search.trim().toLowerCase()
    return source.filter(booking =>
      (isRefunds || matchesTab(booking, tab))
      && (isRefunds || !paymentFilter || booking.paymentStatus === paymentFilter)
      && (!term || [booking.customerName, booking.customerPhone, booking.serviceName, booking.staffName, booking.reference].some(value => value.toLowerCase().includes(term))))
  }, [all, refundsQuery.data, isRefunds, tab, paymentFilter, search])

  const totalPages = Math.max(1, Math.ceil(visible.length / BOOKINGS_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const rows = visible.slice((safePage - 1) * BOOKINGS_PAGE_SIZE, safePage * BOOKINGS_PAGE_SIZE)

  const setTab = (next: BookingsTab) => { setTabState(next); setPaymentFilter(''); setPage(1) }

  const stats = useMemo(() => {
    const confirmed = all.filter(booking => booking.status === 'CONFIRMED')
    const unpaid = all.filter(booking => booking.balanceDue > 0 && booking.status !== 'CANCELLED')
    return [
      { label: 'Upcoming', value: String(all.filter(booking => isUpcoming(booking)).length).padStart(2, '0'), note: 'Next 30 days', icon: CalendarCheck, color: 'bg-[#D8FF72]', onClick: () => setTab('Upcoming') },
      { label: 'Confirmed', value: String(confirmed.length).padStart(2, '0'), note: `${money(confirmed.reduce((sum, booking) => sum + booking.amount, 0))} booked`, icon: CheckCircle2, color: 'bg-[#CDEEDC]', onClick: () => setTab('Confirmed') },
      { label: 'Needs approval', value: String(all.filter(booking => booking.status === 'PENDING').length).padStart(2, '0'), note: 'Review pending requests', icon: Clock3, color: 'bg-[#FFE1AD]', onClick: () => setTab('Pending') },
      { label: 'Unpaid balance', value: moneyCompact(unpaid.reduce((sum, booking) => sum + booking.balanceDue, 0)), note: `Across ${unpaid.length} ${unpaid.length === 1 ? 'booking' : 'bookings'}`, icon: Wallet, color: 'bg-[#DED9FF]', onClick: () => { setTabState('All'); setPaymentFilter('UNPAID'); setPage(1) } },
    ]
  }, [all, money, moneyCompact])

  const pendingRefunds = query.data?.summary.pendingRefunds ?? 0
  const activeQuery = isRefunds ? refundsQuery : query

  return {
    tab,
    setTab,
    stats,
    statsLoading: query.isLoading,
    rows,
    page: safePage,
    totalPages,
    setPage,
    isLoading: activeQuery.isLoading,
    isFetching: activeQuery.isFetching,
    isError: activeQuery.isError,
    retry: () => void activeQuery.refetch(),
    isEmpty: !activeQuery.isLoading && visible.length === 0,
    isFiltered: Boolean(search || paymentFilter) || (!isRefunds && tab !== 'All'),
    isRefunds,
    refundFilter,
    setRefundFilter: (value: typeof refundFilter) => { setRefundFilter(value); setPage(1) },
    pendingRefundsLabel: pendingRefunds ? `${pendingRefunds} pending · ${money(query.data?.summary.pendingRefundsAmount ?? 0)}` : '',
    filter: {
      isOpen: filterMenu.isOpen,
      toggle: filterMenu.toggle,
      close: filterMenu.close,
      search,
      setSearch: (value: string) => { setSearch(value); setPage(1) },
      /** Empty while the list is on its default window, so the filter reads as not set. */
      dates: (range.startDate === defaultBookingsRange().startDate && range.endDate === defaultBookingsRange().endDate
        ? undefined
        : { from: fromIsoDate(range.startDate), to: fromIsoDate(range.endDate) }) as DateRange | undefined,
      /** Clearing goes back to the default window, since the list endpoint always needs one. */
      setDates: (next: DateRange | undefined) => {
        setRange(next?.from ? { startDate: toIsoDate(next.from), endDate: toIsoDate(next.to ?? next.from) } : defaultBookingsRange())
        setPage(1)
      },
      payment: paymentFilter,
      setPayment: (value: string) => { setPaymentFilter(value); setPage(1) },
      clear: () => { setSearch(''); setPaymentFilter(''); setRange(defaultBookingsRange()); setPage(1) },
      isActive: Boolean(search || paymentFilter),
    },
    openNewBooking,
    openBooking,
    exportCsv: () => downloadCsv(
      `bookings-${range.startDate}-to-${range.endDate}.csv`,
      ['Reference', 'Date', 'Time', 'Client', 'Phone', 'Service', 'Attendee', 'Status', 'Payment', 'Amount', 'Paid', 'Balance'],
      visible.map(booking => [booking.reference, booking.date, booking.startTime, booking.customerName, booking.customerPhone, booking.serviceName, booking.staffName, STATUS_LABELS[booking.status] ?? booking.status, booking.paymentStatus, booking.amount, booking.amountPaid, booking.balanceDue]),
    ),
  }
}

export type BookingsPageModel = ReturnType<typeof useBookingsPage>
