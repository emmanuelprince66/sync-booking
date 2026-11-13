import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useBlockedTimesForDates, useSchedule } from '@/api/availability'
import { useBookings, type Booking } from '@/api/bookings'
import type { DateRange } from '@/components/ui/DateRangeFilter'
import { useBookingActions } from '@/features/bookings/hooks/useBookingActions'
import { addDays, fromIsoDate, startOfWeek, timeToMinutes, toIsoDate, todayIso } from '@/lib/dates'

export const HOUR_HEIGHT = 72
const DEFAULT_START_HOUR = 8
const DEFAULT_END_HOUR = 18
/** Monday to Friday, when no schedule has loaded or nothing is open. */
const DEFAULT_DAYS = [0, 1, 2, 3, 4]

/** The design's three event colours: border + background. */
const EVENT_TONES = ['border-[#329661] bg-[#DDF4E6]', 'border-[#8B77E8] bg-[#EAE7FF]', 'border-[#F39B42] bg-[#FFF0D7]'] as const
const toneOf = (name: string) => EVENT_TONES[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % EVENT_TONES.length]

export type CalendarEvent = {
  key: string
  kind: 'booking' | 'blocked'
  title: string
  subtitle: string
  bookingId?: string
  tone: string
  dayIndex: number
  top: number
  height: number
  /** Side-by-side position for bookings that overlap. */
  lane: number
  lanes: number
}

const assignLanes = <T extends { start: number; end: number; lane?: number; lanes?: number }>(items: T[]) => {
  const sorted = [...items].sort((a, b) => a.start - b.start)
  let group: T[] = []
  let groupEnd = -1
  const close = () => { const lanes = Math.max(...group.map(item => (item.lane ?? 0) + 1), 1); group.forEach(item => { item.lanes = lanes }); group = [] }
  for (const item of sorted) {
    if (group.length && item.start >= groupEnd) { close(); groupEnd = -1 }
    const taken = new Set(group.filter(other => other.end > item.start).map(other => other.lane))
    let lane = 0
    while (taken.has(lane)) lane += 1
    item.lane = lane
    group.push(item)
    groupEnd = Math.max(groupEnd, item.end)
  }
  if (group.length) close()
  return sorted
}

/** Week view: open days as columns, opening hours as rows, bookings and blocked time on top. */
export function useCalendar() {
  const { openNewBooking, openBooking, canAddBooking } = useBookingActions()
  const [params] = useSearchParams()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(params.get('date') ? fromIsoDate(params.get('date') as string) : new Date()))
  const [selectedDay, setSelectedDay] = useState(() => params.get('date') ?? todayIso())

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(weekStart, index))), [weekStart])
  const schedule = useSchedule()
  const bookingsQuery = useBookings({ startDate: weekDates[0], endDate: weekDates[6] })
  const blocked = useBlockedTimesForDates(weekDates)
  const today = todayIso()

  const bookings = useMemo(() => (bookingsQuery.data?.bookings ?? []).filter(booking => booking.status !== 'CANCELLED'), [bookingsQuery.data])

  const days = useMemo(() => {
    const open = (schedule.data ?? []).filter(day => !day.isClosed).map(day => day.dayOfWeek)
    // A booking on a closed day still needs a column.
    const withBookings = weekDates.map((iso, index) => (bookings.some(booking => booking.date === iso) ? index : -1)).filter(index => index >= 0)
    const indexes = [...new Set([...(open.length ? open : DEFAULT_DAYS), ...withBookings])].sort((a, b) => a - b)
    return indexes.map(index => {
      const date = addDays(weekStart, index)
      const iso = weekDates[index]
      return { iso, weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(), dayNumber: date.getDate(), isToday: iso === today }
    })
  }, [schedule.data, weekDates, weekStart, bookings, today])

  const { startHour, hours } = useMemo(() => {
    const openDays = (schedule.data ?? []).filter(day => !day.isClosed)
    const eventStarts = bookings.map(booking => timeToMinutes(booking.startTime))
    const eventEnds = bookings.map(booking => timeToMinutes(booking.startTime) + booking.durationMinutes)
    const first = Math.min(DEFAULT_START_HOUR * 60, ...openDays.map(day => timeToMinutes(day.openTime)), ...eventStarts)
    const last = Math.max(DEFAULT_END_HOUR * 60, ...openDays.map(day => timeToMinutes(day.closeTime)), ...eventEnds)
    const from = Math.floor(first / 60)
    const to = Math.min(24, Math.ceil(last / 60))
    return { startHour: from, hours: Array.from({ length: to - from }, (_, index) => `${String(from + index).padStart(2, '0')}:00`) }
  }, [schedule.data, bookings])

  const events = useMemo(() => {
    const result: CalendarEvent[] = []
    days.forEach((day, dayIndex) => {
      const placed = assignLanes(bookings.filter(booking => booking.date === day.iso).map((booking: Booking) => ({ booking, start: timeToMinutes(booking.startTime), end: timeToMinutes(booking.startTime) + booking.durationMinutes } as { booking: Booking; start: number; end: number; lane?: number; lanes?: number })))
      placed.forEach(({ booking, start, end, lane, lanes }) => result.push({
        key: booking.id, kind: 'booking', bookingId: booking.id, title: booking.serviceName, subtitle: `${booking.startTime} · ${booking.customerName.split(' ')[0]}`, tone: toneOf(booking.serviceName), dayIndex,
        top: ((start - startHour * 60) / 60) * HOUR_HEIGHT, height: Math.max(((end - start) / 60) * HOUR_HEIGHT - 6, 62), lane: lane ?? 0, lanes: lanes ?? 1,
      }))
      blocked.blockedTimes.filter(item => item.date === day.iso).forEach(item => {
        const start = timeToMinutes(item.startTime)
        const end = timeToMinutes(item.endTime)
        result.push({ key: item.id, kind: 'blocked', title: item.reason || 'Blocked time', subtitle: `${item.startTime}–${item.endTime}`, tone: 'border-[#A9B7B0] bg-[#EFF2F0]', dayIndex, top: ((start - startHour * 60) / 60) * HOUR_HEIGHT, height: Math.max(((end - start) / 60) * HOUR_HEIGHT - 6, 62), lane: 0, lanes: 1 })
      })
    })
    return result
  }, [days, bookings, blocked.blockedTimes, startHour])

  const first = addDays(weekStart, 0)
  const last = addDays(weekStart, 6)
  const dayRow = weekDates.map((iso, index) => {
    const date = addDays(weekStart, index)
    return { iso, weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }), dayNumber: date.getDate(), isSelected: iso === selectedDay, isToday: iso === today }
  })

  return {
    openNewBooking,
    canAddBooking,
    openBooking,
    days,
    hours,
    events,
    isLoading: schedule.isLoading || bookingsQuery.isLoading,
    isError: bookingsQuery.isError,
    retry: () => void bookingsQuery.refetch(),
    isFetching: bookingsQuery.isFetching,
    rangeLabel: `${first.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${last.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    previousWeek: () => { const next = addDays(weekStart, -7); setWeekStart(next); setSelectedDay(toIsoDate(next)) },
    nextWeek: () => { const next = addDays(weekStart, 7); setWeekStart(next); setSelectedDay(toIsoDate(next)) },
    goToToday: () => { setWeekStart(startOfWeek(new Date())); setSelectedDay(today) },
    /** The date picker: shows that day's week. */
    jumpValue: selectedDay === today ? undefined : ({ from: fromIsoDate(selectedDay), to: fromIsoDate(selectedDay) } as DateRange),
    jumpTo: (range: DateRange | undefined) => {
      const date = range?.from ?? new Date()
      setWeekStart(startOfWeek(date))
      setSelectedDay(toIsoDate(date))
    },
    // Phones get one day at a time instead of a seven-column grid.
    dayRow,
    selectDay: setSelectedDay,
    dayBookings: bookings.filter(booking => booking.date === selectedDay),
    dayBlocked: blocked.blockedTimes.filter(item => item.date === selectedDay),
  }
}
