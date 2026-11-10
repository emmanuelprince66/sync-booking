import type { Booking, BookingStatus, PaymentStatus } from '@/api/bookings'
import type { BlockedTime, ScheduleDay } from '@/api/availability'
import type { Service } from '@/api/services'
import { fromIsoDate, minutesToTime, timeToMinutes, todayIso, weekdayIndex } from '@/lib/dates'

export const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', IN_PROGRESS: 'In progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled', NO_SHOW: 'No show', RESCHEDULED: 'Rescheduled',
}

export const STATUS_STYLES: Record<BookingStatus, string> = {
  CONFIRMED: 'bg-[#E2F7E9] text-[#157443]',
  PENDING: 'bg-[#FFF1CB] text-[#946000]',
  COMPLETED: 'bg-[#E7EEF7] text-[#38546F]',
  IN_PROGRESS: 'bg-[#DDF4E6] text-[#176D43]',
  CANCELLED: 'bg-[#FDE8E4] text-[#B2402F]',
  NO_SHOW: 'bg-[#F1F5F0] text-[#657C71]',
  RESCHEDULED: 'bg-[#EAE7FF] text-[#5A49B0]',
}

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  PAID: 'PAID', UNPAID: 'UNPAID', DEPOSIT_PAID: 'DEPOSIT', REFUND_PENDING: 'REFUND DUE', REFUNDED: 'REFUNDED', DEPOSIT_FORFEITED: 'FORFEITED',
}

export const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  PAID: 'text-[#278458]', UNPAID: 'text-[#C77918]', DEPOSIT_PAID: 'text-[#C77918]', REFUND_PENDING: 'text-[#B2402F]', REFUNDED: 'text-[#38546F]', DEPOSIT_FORFEITED: 'text-[#657C71]',
}

export const PAYMENT_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Any payment status' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'DEPOSIT_PAID', label: 'Deposit paid' },
  { value: 'PAID', label: 'Paid' },
]

/** Booking row avatars, in the design's order. */
const CLIENT_COLORS = ['bg-[#FFE1AD]', 'bg-[#D8D2FF]', 'bg-[#BEEAD2]', 'bg-[#FFD0C7]'] as const
/** Service tiles, in the design's order. */
const SERVICE_COLORS = ['bg-[#FFCA68]', 'bg-[#91D9B2]', 'bg-[#B9ADF5]', 'bg-[#FF9F8C]'] as const

const hashOf = (text: string) => [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0)

/** Team tiles, in the design's order. */
const TEAM_COLORS = ['bg-[#FFE1AD]', 'bg-[#CDEEDC]', 'bg-[#DED9FF]'] as const
export const teamColor = (index: number) => TEAM_COLORS[index % TEAM_COLORS.length]

export const clientColor = (name: string) => CLIENT_COLORS[hashOf(name) % CLIENT_COLORS.length]
export const serviceColor = (index: number) => SERVICE_COLORS[index % SERVICE_COLORS.length]
export const serviceInitialsColor = (name: string) => SERVICE_COLORS[hashOf(name) % SERVICE_COLORS.length]

const ACTIVE_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'RESCHEDULED']

export const isActiveBooking = (booking: Booking) => ACTIVE_STATUSES.includes(booking.status)

export const startsAtMs = (booking: Booking) => fromIsoDate(booking.date).getTime() + timeToMinutes(booking.startTime) * 60_000

/** Still to come: active and not started yet. */
export const isUpcoming = (booking: Booking, now = Date.now()) => isActiveBooking(booking) && startsAtMs(booking) >= now

/** Attendees who can take a service: the ones assigned to it, or everyone when it has none. */
export const eligibleStaff = <T extends { id: string }>(attendants: T[], service?: Pick<Service, 'assignedStaffIds'>) =>
  service?.assignedStaffIds.length ? attendants.filter(attendant => service.assignedStaffIds.includes(attendant.id)) : attendants

type SlotInput = {
  date: string
  day: ScheduleDay | undefined
  intervalMinutes: number
  durationMinutes: number
  staffId: string
  bookings: Booking[]
  blockedTimes: BlockedTime[]
  now?: Date
}

const overlaps = (startA: number, endA: number, startB: number, endB: number) => startA < endB && startB < endA

/**
 * Bookable start times for one day: inside opening hours, the whole service fits
 * before closing, and it doesn't run into a break, blocked time or the attendee's
 * other bookings. Past times are dropped on today.
 */
export const buildSlots = ({ date, day, intervalMinutes, durationMinutes, staffId, bookings, blockedTimes, now = new Date() }: SlotInput): string[] => {
  if (!day || day.isClosed || intervalMinutes <= 0) return []
  const open = timeToMinutes(day.openTime)
  const close = timeToMinutes(day.closeTime)
  const nowMinutes = date === todayIso() ? now.getHours() * 60 + now.getMinutes() : -1
  const busy = [
    ...day.breaks.map(item => [timeToMinutes(item.startTime), timeToMinutes(item.endTime)]),
    ...blockedTimes.filter(item => item.date === date && (!item.staffId || item.staffId === staffId)).map(item => [timeToMinutes(item.startTime), timeToMinutes(item.endTime)]),
    ...bookings.filter(item => item.date === date && isActiveBooking(item) && (!item.staffId || item.staffId === staffId)).map(item => [timeToMinutes(item.startTime), timeToMinutes(item.startTime) + item.durationMinutes]),
  ]
  const slots: string[] = []
  for (let start = open; start + durationMinutes <= close; start += intervalMinutes) {
    if (start <= nowMinutes) continue
    if (busy.some(([from, to]) => overlaps(start, start + durationMinutes, from, to))) continue
    slots.push(minutesToTime(start))
  }
  return slots
}

/** day_of_week of a yyyy-MM-dd date. */
export const dayOfWeekOf = (iso: string) => weekdayIndex(fromIsoDate(iso))
