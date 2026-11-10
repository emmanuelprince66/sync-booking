import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useBookings, type Booking } from '@/api/bookings'
import { useCustomerProfile, type Customer } from '@/api/customers'
import { PAYMENT_LABELS, PAYMENT_STYLES, clientColor, isUpcoming } from '@/features/bookings/utils'
import { useFormatMoney, useFormatMoneyCompact } from '@/hooks/useFormatMoney'
import { addDays, fromIsoDate, toIsoDate } from '@/lib/dates'
import { initials } from '@/lib/format'
import { paths } from '@/routes/paths'
import { useUiStore } from '@/stores/ui-store'
import { CLIENT_STATUS_STYLES, birthdayLabel, genderLabel } from '../utils'
import { useDeleteClient } from './useDeleteClient'

/** How far back and ahead the booking history looks. The bookings endpoint takes a date range only, with no client filter. */
const HISTORY_PAST_DAYS = 365
const HISTORY_AHEAD_DAYS = 90

export type HistoryFilter = 'all' | 'upcoming' | 'past'
export const HISTORY_FILTERS: { value: HistoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
]

const digits = (value: string) => value.replace(/\D/g, '')

/** A booking belongs to the client by id, or (older bookings without one) by the same phone number. */
const isClientsBooking = (booking: Booking, client: Customer) =>
  booking.customerId ? booking.customerId === client.id : Boolean(digits(client.phone)) && digits(booking.customerPhone).endsWith(digits(client.phone).slice(-10))

const longDate = (iso: string) => {
  if (!iso) return ''
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? fromIsoDate(iso) : new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** One client's page: sink's customer profile (identity, journey, figures) plus their booking history. */
export function useClientDetail() {
  const { clientId = '' } = useParams()
  const navigate = useNavigate()
  const money = useFormatMoney()
  const compact = useFormatMoneyCompact()
  const openBooking = useUiStore(state => state.setSelectedBookingId)
  const profileQuery = useCustomerProfile(clientId)
  const [isEditing, setEditing] = useState(false)
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [range] = useState(() => ({ startDate: toIsoDate(addDays(new Date(), -HISTORY_PAST_DAYS)), endDate: toIsoDate(addDays(new Date(), HISTORY_AHEAD_DAYS)) }))
  const bookingsQuery = useBookings(range, { enabled: Boolean(profileQuery.data) })
  const goBack = () => navigate(paths.clients)
  const remove = useDeleteClient(goBack)

  const profile = profileQuery.data ?? null
  const client = profile?.customer ?? null
  const [now] = useState(() => Date.now())
  const history = client ? (bookingsQuery.data?.bookings ?? []).filter(booking => isClientsBooking(booking, client)).reverse() : []
  const visible = history.filter(booking => filter === 'all' || (filter === 'upcoming' ? isUpcoming(booking, now) : !isUpcoming(booking, now)))
  const address = client?.address ? [client.address.address, client.address.city, client.address.state].filter(Boolean).join(', ') : ''

  return {
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    isMissing: !profileQuery.isLoading && !profileQuery.isError && !profile,
    retry: () => void profileQuery.refetch(),
    goBack,
    client,
    header: client && profile
      ? {
        name: client.name,
        initials: initials(client.name || '?'),
        color: clientColor(client.name),
        meta: [client.customerCode, client.gender && genderLabel(client.gender), profile.customerSince && `Since ${profile.customerSince}`].filter(Boolean).join(' · '),
        status: client.status,
        statusClassName: CLIENT_STATUS_STYLES[client.status] ?? CLIENT_STATUS_STYLES.Inactive,
        churnRisk: profile.churnRisk,
      }
      : null,
    stats: profile
      ? [
        { label: 'Bookings', value: String(profile.totalOrders) },
        { label: 'Total spent', value: compact(profile.totalSpend) },
        { label: 'Avg. booking', value: compact(profile.averageBasket) },
        { label: 'Lifetime value', value: compact(profile.lifetimeValue) },
        { label: 'Retention', value: `${profile.retentionScore}/100` },
      ]
      : [],
    info: client && profile
      ? [
        { label: 'Phone', value: client.phone, href: client.phone ? `tel:${client.phone}` : undefined },
        { label: 'Email', value: client.email, href: client.email ? `mailto:${client.email}` : undefined },
        { label: 'Gender', value: client.gender ? genderLabel(client.gender) : '' },
        { label: 'Birthday', value: birthdayLabel(client.dateOfBirth) },
        { label: 'Address', value: address },
        { label: 'Favourite service', value: profile.favouriteService },
        { label: 'Preferred payment', value: profile.preferredPayment },
        { label: 'Last visit', value: client.lastVisit || longDate(profile.journey.latestPurchase) },
      ].map(item => ({ ...item, value: item.value || '—' }))
      : [],
    journey: profile
      ? [
        { label: 'Became a client', date: longDate(profile.journey.registered) },
        { label: 'First booking', date: longDate(profile.journey.firstPurchase) },
        { label: 'Latest booking', date: longDate(profile.journey.latestPurchase) },
      ]
      : [],
    history: {
      isLoading: bookingsQuery.isLoading || profileQuery.isLoading,
      isError: bookingsQuery.isError,
      retry: () => void bookingsQuery.refetch(),
      filter,
      setFilter,
      filters: HISTORY_FILTERS,
      windowLabel: `Bookings from the last 12 months and the next ${HISTORY_AHEAD_DAYS} days`,
      count: history.length,
      rows: visible.map(booking => ({
        booking,
        date: longDate(booking.date),
        time: booking.startTime,
        staff: booking.staffName || 'Unassigned',
        price: money(booking.amount),
        paymentLabel: PAYMENT_LABELS[booking.paymentStatus] ?? booking.paymentStatus,
        paymentClassName: PAYMENT_STYLES[booking.paymentStatus] ?? 'text-[#657C71]',
        open: () => openBooking(booking.id),
      })),
    },
    isEditing,
    openEdit: () => setEditing(true),
    closeEdit: () => setEditing(false),
    remove,
  }
}

export type ClientDetailModel = ReturnType<typeof useClientDetail>
