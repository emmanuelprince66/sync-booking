import type { Customer } from '@/api/customers'
import { clientColor } from '@/features/bookings/utils'
import { BIRTH_MONTHS, parseBirthday } from '@/lib/birthday'
import { initials } from '@/lib/format'

/** Sink's status tones, in CLIQBOOK colours. */
export const CLIENT_STATUS_STYLES: Record<string, string> = {
  Active: 'bg-[#E2F7E9] text-[#157443]',
  'At Risk': 'bg-[#FFF1CB] text-[#946000]',
  Inactive: 'bg-[#F1F5F0] text-[#657C71]',
}

/** What one client row shows, in the table and on the phone card. */
export const toClientRow = (client: Customer, money: (amount: number) => string) => ({
  client,
  initials: initials(client.name || '?'),
  color: clientColor(client.name),
  contact: client.email || client.phone,
  bookings: `${client.bookingsCount} ${client.bookingsCount === 1 ? 'booking' : 'bookings'}`,
  spent: money(client.totalSpent),
  lastVisit: client.lastVisit || '—',
  status: client.status,
  statusClassName: CLIENT_STATUS_STYLES[client.status] ?? CLIENT_STATUS_STYLES.Inactive,
})

export type ClientRow = ReturnType<typeof toClientRow>

/** "12 March 1994", or "12 March" when no year was given. */
export const birthdayLabel = (value: string) => {
  const { day, month, year } = parseBirthday(value)
  if (!day || !month) return ''
  return [Number(day), BIRTH_MONTHS[Number(month) - 1]?.label, year].filter(Boolean).join(' ')
}

const GENDER_LABELS: Record<string, string> = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' }
export const genderLabel = (value: string) => GENDER_LABELS[value.toUpperCase()] ?? value
