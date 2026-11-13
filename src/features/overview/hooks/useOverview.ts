import { Banknote, CalendarCheck, CalendarDays, CheckCircle2, Clock3, Sparkles, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DEFAULT_SETTINGS, useBookingSettings, useSchedule } from '@/api/availability'
import { useBookings, useDefaultBookings, type Booking } from '@/api/bookings'
import { useNewClientsThisMonth } from '@/api/customers'
import type { StatTone } from '@/components/ui/ColorStatCard'
import type { DateRange } from '@/components/ui/DateRangeFilter'
import { useBookingActions } from '@/features/bookings/hooks/useBookingActions'
import { isActiveBooking, isUpcoming } from '@/features/bookings/utils'
import { useFormatMoneyCompact } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { addDays, startOfWeek, timeToMinutes, toIsoDate, todayIso, weekdayDayMonth } from '@/lib/dates'

const UPCOMING_ROWS = 5

/** Money taken on a booking and kept: refunded or refund-due payments don't count. */
const collectedOn = (booking: Booking) => (booking.paymentStatus === 'REFUNDED' || booking.paymentStatus === 'REFUND_PENDING' ? 0 : booking.amountPaid)

type OverviewCard = { label: string; value: string; note: string; tone: StatTone; icon: typeof CalendarDays; isLoading: boolean }

/**
 * Overview screen: stats and the upcoming list, all worked out from the live bookings, schedule and customers.
 * Attendants get their own bookings only (the bookings hooks narrow them) and cards about their own day,
 * with no business-wide figures (new clients, booking rate, revenue).
 */
export function useOverview() {
  const { openNewBooking, openBooking, canAddBooking } = useBookingActions()
  const { isAttendant, canManageServices } = usePermissions()
  const moneyCompact = useFormatMoneyCompact()
  const bookingsQuery = useDefaultBookings()
  const scheduleQuery = useSchedule()
  const settingsQuery = useBookingSettings()
  const newClientsQuery = useNewClientsThisMonth({ enabled: !isAttendant })
  // The list can look at any dates; the stat cards always describe the current week and month.
  const [listRange, setListRange] = useState<DateRange | undefined>()
  const rangeQuery = useBookings({ startDate: listRange?.from ? toIsoDate(listRange.from) : '', endDate: listRange?.from ? toIsoDate(listRange.to ?? listRange.from) : '' }, { enabled: Boolean(listRange?.from) })

  const today = todayIso()
  const tomorrow = toIsoDate(addDays(new Date(), 1))
  const weekEnd = toIsoDate(addDays(startOfWeek(new Date()), 6))
  const monthPrefix = today.slice(0, 7)
  const bookings = useMemo(() => bookingsQuery.data?.bookings ?? [], [bookingsQuery.data])

  const summary = useMemo(() => {
    const todays = bookings.filter(booking => booking.date === today && booking.status !== 'CANCELLED')
    const upcoming = bookings.filter(booking => booking.date > today && isActiveBooking(booking))
    const thisWeek = bookings.filter(booking => booking.date <= weekEnd)
    const thisWeekLive = thisWeek.filter(booking => booking.status !== 'CANCELLED')
    const list = bookings.filter(booking => booking.date === today ? isActiveBooking(booking) : isUpcoming(booking)).slice(0, UPCOMING_ROWS)
    return {
      todayCount: todays.length,
      awaiting: todays.filter(booking => booking.status === 'PENDING').length,
      upcomingThisMonth: upcoming.filter(booking => booking.date.startsWith(monthPrefix)).length,
      upcomingCount: upcoming.length,
      upcomingAwaiting: upcoming.filter(booking => booking.status === 'PENDING').length,
      weekCompleted: thisWeekLive.filter(booking => booking.status === 'COMPLETED').length,
      weekLive: thisWeekLive.length,
      weekRevenue: thisWeek.reduce((sum, booking) => sum + collectedOn(booking), 0),
      weekPaidCount: thisWeek.filter(booking => collectedOn(booking) > 0).length,
      weekBookedMinutes: thisWeekLive.reduce((sum, booking) => sum + booking.durationMinutes, 0),
      tomorrowCount: bookings.filter(booking => booking.date === tomorrow && isActiveBooking(booking)).length,
      list,
    }
  }, [bookings, today, tomorrow, weekEnd, monthPrefix])

  // Booking rate: minutes booked this week against the minutes open this week.
  const interval = (settingsQuery.data ?? DEFAULT_SETTINGS).bookingInterval
  const openMinutes = (scheduleQuery.data ?? []).filter(day => !day.isClosed).reduce((sum, day) => sum + Math.max(0, timeToMinutes(day.closeTime) - timeToMinutes(day.openTime)), 0)
  const openSlots = Math.floor(openMinutes / interval)
  const bookingRate = openMinutes ? Math.min(100, Math.round((summary.weekBookedMinutes / openMinutes) * 100)) : 0

  const statsLoading = bookingsQuery.isLoading
  const rangeList = (rangeQuery.data?.bookings ?? []).slice(0, UPCOMING_ROWS)
  const todayCard: OverviewCard = { label: isAttendant ? 'Booked today' : 'Today’s bookings', value: String(summary.todayCount), note: `${summary.awaiting} awaiting approval`, tone: 'lime', icon: CalendarDays, isLoading: statsLoading }
  const cards: OverviewCard[] = isAttendant
    ? [
      todayCard,
      { label: 'Upcoming', value: String(summary.upcomingCount), note: summary.upcomingAwaiting ? `${summary.upcomingAwaiting} awaiting approval` : 'Next 30 days', tone: 'mint', icon: CalendarCheck, isLoading: statsLoading },
      { label: 'Completed this week', value: String(summary.weekCompleted), note: `Of ${summary.weekLive} this week`, tone: 'peach', icon: CheckCircle2, isLoading: statsLoading },
      { label: 'Tomorrow', value: String(summary.tomorrowCount), note: summary.tomorrowCount ? 'Booked with you' : 'Nothing booked yet', tone: 'lilac', icon: Clock3, isLoading: statsLoading },
    ]
    : [
      todayCard,
      { label: 'This week’s revenue', value: moneyCompact(summary.weekRevenue), note: summary.weekPaidCount ? `Paid in on ${summary.weekPaidCount} ${summary.weekPaidCount === 1 ? 'booking' : 'bookings'}` : 'Nothing paid in yet', tone: 'mint', icon: Banknote, isLoading: statsLoading },
      { label: 'New clients', value: String(newClientsQuery.data ?? 0), note: 'This month', tone: 'peach', icon: Users, isLoading: newClientsQuery.isLoading },
      { label: 'Booking rate', value: `${bookingRate}%`, note: `Across ${openSlots} open slots`, tone: 'lilac', icon: Sparkles, isLoading: statsLoading || scheduleQuery.isLoading },
    ]
  return {
    dateLabel: weekdayDayMonth(new Date()),
    tagline: summary.todayCount === 0 ? (isAttendant ? 'Nothing booked with you today yet.' : 'A clear day ahead. A good moment to share your link.') : summary.todayCount > 3 ? 'Your day is looking beautifully busy.' : 'A nicely paced day ahead.',
    statsLoading,
    cards,
    /** The “Block time” card leads to Availability, which Attendants can't open. */
    showBlockTime: canManageServices,
    listRange,
    setListRange,
    listTitle: listRange?.from ? 'Bookings in these dates' : 'Today & upcoming',
    list: listRange?.from ? rangeList : summary.list,
    listLoading: listRange?.from ? rangeQuery.isLoading : bookingsQuery.isLoading,
    listError: listRange?.from ? rangeQuery.isError : bookingsQuery.isError,
    retryList: () => void (listRange?.from ? rangeQuery : bookingsQuery).refetch(),
    listNote: listRange?.from ? `${rangeList.length} ${rangeList.length === 1 ? 'booking' : 'bookings'}` : `${summary.todayCount} today · ${summary.upcomingThisMonth} upcoming this month`,
    listEmptyTitle: listRange?.from ? 'Nothing booked in these dates' : 'Nothing on the books yet',
    listEmptyText: listRange?.from ? 'Try a wider date range.' : 'New bookings for today and the coming weeks will show up here.',
    tomorrowLabel: `Tomorrow · ${summary.tomorrowCount} ${summary.tomorrowCount === 1 ? 'booking' : 'bookings'}`,
    openNewBooking,
    canAddBooking,
    openBooking,
  }
}
