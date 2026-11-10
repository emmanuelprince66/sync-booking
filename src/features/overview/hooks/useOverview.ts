import { ArrowRight, CalendarDays, Sparkles, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DEFAULT_SETTINGS, useBookingSettings, useSchedule } from '@/api/availability'
import { useBookings, useDefaultBookings } from '@/api/bookings'
import { useNewClientsThisMonth } from '@/api/customers'
import type { DateRange } from '@/components/ui/DateRangeFilter'
import { useBookingActions } from '@/features/bookings/hooks/useBookingActions'
import { isActiveBooking, isUpcoming } from '@/features/bookings/utils'
import { useFormatMoneyCompact } from '@/hooks/useFormatMoney'
import { addDays, startOfWeek, timeToMinutes, toIsoDate, todayIso, weekdayDayMonth } from '@/lib/dates'

const pad = (value: number) => String(value).padStart(2, '0')
const UPCOMING_ROWS = 5

/** Overview screen: stats and the upcoming list, all worked out from the live bookings, schedule and customers. */
export function useOverview() {
  const { openNewBooking, openBooking } = useBookingActions()
  const moneyCompact = useFormatMoneyCompact()
  const bookingsQuery = useDefaultBookings()
  const scheduleQuery = useSchedule()
  const settingsQuery = useBookingSettings()
  const newClientsQuery = useNewClientsThisMonth()
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
    const list = bookings.filter(booking => booking.date === today ? isActiveBooking(booking) : isUpcoming(booking)).slice(0, UPCOMING_ROWS)
    return {
      todayCount: todays.length,
      awaiting: todays.filter(booking => booking.status === 'PENDING').length,
      upcomingThisMonth: upcoming.filter(booking => booking.date.startsWith(monthPrefix)).length,
      weekRevenue: thisWeek.reduce((sum, booking) => sum + booking.amountPaid, 0),
      weekBookedMinutes: thisWeek.filter(booking => booking.status !== 'CANCELLED').reduce((sum, booking) => sum + booking.durationMinutes, 0),
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
  return {
    dateLabel: weekdayDayMonth(new Date()),
    tagline: summary.todayCount === 0 ? 'A clear day ahead. A good moment to share your link.' : summary.todayCount > 3 ? 'Your day is looking beautifully busy.' : 'A nicely paced day ahead.',
    statsLoading,
    cards: [
      { label: 'Today’s bookings', value: pad(summary.todayCount), note: `${summary.awaiting} awaiting approval`, color: 'bg-[#D8FF72]', icon: CalendarDays, isLoading: statsLoading },
      { label: 'This week’s revenue', value: moneyCompact(summary.weekRevenue), note: 'Paid in so far', color: 'bg-[#CDEEDC]', icon: ArrowRight, isLoading: statsLoading },
      { label: 'New clients', value: pad(newClientsQuery.data ?? 0), note: 'This month', color: 'bg-[#FFE1AD]', icon: Users, isLoading: newClientsQuery.isLoading },
      { label: 'Booking rate', value: `${bookingRate}%`, note: `Across ${openSlots} open slots`, color: 'bg-[#DED9FF]', icon: Sparkles, isLoading: statsLoading || scheduleQuery.isLoading },
    ],
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
    openBooking,
  }
}
