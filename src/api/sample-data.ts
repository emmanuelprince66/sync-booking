/**
 * Sample data from the design. Two uses:
 *  - mock mode (VITE_AUTH_MODE=mock) reads and writes all of it, so the app can be previewed offline;
 *  - `noEndpointSample` is what live mode still shows where the backend has no endpoint.
 *    Anything read from it must sit next to a <SampleDataBadge/>.
 */
import { addDays, toIsoDate } from '@/lib/dates'
import type { Attendant } from './attendants'
import type { BlockedTime, BookingSettings, ScheduleDay } from './availability'
import type { BankAccount } from './banks'
import type { Booking } from './bookings'
import type { Customer } from './customers'
import type { AppNotification } from './notifications'
import type { ServiceCategory } from './categories'
import type { Service } from './services'

const day = (offset: number) => toIsoDate(addDays(new Date(), offset))

const booking = (id: number, name: string, service: Service, offset: number, startTime: string, status: Booking['status'], paymentStatus: Booking['paymentStatus'], staffName: string, extra: Partial<Booking> = {}): Booking => {
  const paid = paymentStatus === 'PAID'
  const [hours, minutes] = startTime.split(':').map(Number)
  const end = hours * 60 + minutes + service.duration
  return {
    id: `sample-booking-${id}`,
    reference: `CB-204${id}`,
    date: day(offset),
    startTime,
    endTime: `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`,
    durationMinutes: service.duration,
    customerId: `sample-client-${name.split(' ')[0].toLowerCase()}`,
    customerName: name,
    customerPhone: '0803 245 7791',
    customerEmail: `${name.toLowerCase().replace(' ', '.')}@email.com`,
    serviceId: service.id,
    serviceName: service.name,
    staffId: staffName ? `sample-staff-${staffName.split(' ')[0].toLowerCase()}` : '',
    staffName,
    amount: service.amount,
    amountPaid: paid ? service.amount : 0,
    balanceDue: paid ? 0 : service.amount,
    refundableAmount: 0,
    paymentOption: paid ? 'FULL_PAYMENT' : 'PAY_AT_BUSINESS',
    paymentStatus,
    status,
    source: 'staff',
    notes: '',
    cancellationReason: '',
    ...extra,
  }
}

const service = (id: string, name: string, duration: number, amount: number, categoryName = 'Hair & beauty'): Service => ({
  id, name, duration, amount, categoryId: 'sample-category-1', categoryName, description: '', image: '', isActive: true, assignedStaffIds: [], minDepositPercentage: null, maxCapacity: 1,
})

const silk = service('sample-service-1', 'Silk press & trim', 90, 18500)
const braids = service('sample-service-2', 'Knotless braids', 180, 35000)
const wash = service('sample-service-3', 'Wash day treatment', 60, 12000)
const bridal = service('sample-service-4', 'Bridal consultation', 45, 8000)

const defaultSchedule = (): ScheduleDay[] => Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, isClosed: dayOfWeek >= 5, openTime: '09:00', closeTime: '18:00', breaks: [] }))

/** Mutable in mock mode: mutations write here so every screen stays in step. */
export const sample = {
  services: [silk, braids, wash, bridal] as Service[],
  categories: [{ id: 'sample-category-1', name: 'Hair & beauty' }, { id: 'sample-category-2', name: 'Consultations' }] as ServiceCategory[],
  bookings: [
    booking(1, 'Amara Okafor', silk, 0, '09:00', 'CONFIRMED', 'PAID', 'Jenny Akin'),
    booking(2, 'Teni Williams', bridal, 0, '11:30', 'PENDING', 'UNPAID', ''),
    booking(3, 'Zainab Bello', braids, 1, '13:00', 'CONFIRMED', 'PAID', 'Maya Johnson'),
    booking(4, 'Nneka Eze', wash, 4, '16:30', 'CONFIRMED', 'UNPAID', 'Jenny Akin'),
    booking(5, 'Kemi Adeyemi', silk, -1, '10:00', 'COMPLETED', 'PAID', 'Jenny Akin'),
    booking(6, 'Bisi Adewale', wash, 2, '11:00', 'CONFIRMED', 'DEPOSIT_PAID', 'Maya Johnson', { amountPaid: 4000, balanceDue: 8000, paymentOption: 'DEPOSIT' }),
    booking(7, 'Ada Nwosu', bridal, 3, '09:30', 'CANCELLED', 'REFUND_PENDING', 'Jenny Akin', { amountPaid: 8000, balanceDue: 0, refundableAmount: 8000, cancellationReason: 'Client travelling' }),
    booking(8, 'Tolu Bakare', braids, 7, '10:00', 'CONFIRMED', 'UNPAID', 'Maya Johnson'),
  ] as Booking[],
  customers: [
    { id: 'sample-client-amara', name: 'Amara Okafor', email: 'amara.okafor@email.com', phone: '0803 245 7791', bookingsCount: 8, totalSpent: 146000, gender: 'FEMALE', dateOfBirth: '1994-03-12', address: { address: '12 Admiralty Way', city: 'Lekki', state: 'Lagos', country: 'Nigeria', phone: '', latitude: '', longitude: '', isDefault: true }, customerCode: 'CUS-4A21F0', status: '', lastVisit: '' },
    { id: 'sample-client-zainab', name: 'Zainab Bello', email: 'zainab.bello@email.com', phone: '0812 410 6620', bookingsCount: 6, totalSpent: 198000, gender: '', dateOfBirth: '', address: null, customerCode: '', status: '', lastVisit: '' },
    { id: 'sample-client-teni', name: 'Teni Williams', email: 'teni.williams@email.com', phone: '0701 998 2034', bookingsCount: 4, totalSpent: 52000, gender: '', dateOfBirth: '', address: null, customerCode: '', status: '', lastVisit: '' },
    { id: 'sample-client-nneka', name: 'Nneka Eze', email: 'nneka.eze@email.com', phone: '0906 551 7812', bookingsCount: 3, totalSpent: 39500, gender: '', dateOfBirth: '', address: null, customerCode: '', status: '', lastVisit: '' },
  ] as Customer[],
  attendants: [
    { id: 'sample-staff-jenny', name: 'Jenny Akin', role: 'OWNER', roleLabel: 'Owner · Hair stylist', phone: '0802 400 1294', isActive: true },
    { id: 'sample-staff-maya', name: 'Maya Johnson', role: 'ATTENDANT', roleLabel: 'Braider', phone: '0803 111 2200', isActive: true },
    { id: 'sample-staff-dara', name: 'Dara Cole', role: 'ATTENDANT', roleLabel: 'Studio assistant', phone: '0805 339 4471', isActive: true },
  ] as Attendant[],
  schedule: defaultSchedule(),
  settings: {
    bookingInterval: 15, minNoticeHours: 4, maxAdvanceDays: 60, cancellationWindowHours: 24,
    allowFullPayment: true, allowDeposit: false, allowPayAtBusiness: false, minDepositPercentage: 30, isDepositNonRefundable: false, customPolicyText: '',
  } as BookingSettings,
  blockedTimes: [{ id: 'sample-block-1', date: day(5), startTime: '12:00', endTime: '16:00', reason: 'Personal appointment', staffId: null }] as BlockedTime[],
  banks: [{ id: 'sample-bank-1', bankName: 'GTBank', accountNumber: '0123458812', accountName: 'Juno Studio' }] as BankAccount[],
  bankOptions: [{ code: '058', name: 'GTBank' }, { code: '044', name: 'Access Bank' }],
  wallet: { balance: 184250, hasAccount: true, tier: 3, verified: true },
  notifications: [
    { id: 'sample-note-1', message: 'Teni Williams requested a bridal consultation.', isRead: false, createdAt: new Date().toISOString() },
    { id: 'sample-note-2', message: 'Payment received for Amara Okafor’s silk press.', isRead: true, createdAt: addDays(new Date(), -1).toISOString() },
  ] as AppNotification[],
  newClientsThisMonth: 12,
}

/** Design content with no backend endpoint. Shown in live mode only with a SampleDataBadge. */
export const noEndpointSample = {
  pendingPayout: 42000,
  pendingPayoutNote: 'Clears in 2 days',
  totalEarned: 1840000,
  totalEarnedNote: 'Since January',
  payoutSchedule: 'Every Monday',
  extraService: { name: 'Hydration treatment', initials: 'HT', durationLabel: '30 minutes', amount: 7500 },
}

export type SampleBookingSeed = typeof sample
