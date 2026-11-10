import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { normalizeTime } from '@/lib/dates'
import { useBusinessScope } from './business'
import { asRecord, isLive, listFrom, num, str } from './http'
import { queryKeys } from './query-keys'
import { sample } from './sample-data'

/**
 * Availability, same backend as sink-inventory:
 *  GET/PUT  service/schedule/{business_id}/           { schedules: Day[] }   day_of_week: 0 = Monday
 *  GET/PATCH service/booking-settings/{business_id}/
 *  GET/POST service/blocked-times/{business_id}/      GET takes ?date=yyyy-MM-dd
 *  DELETE   service/blocked-times/{business_id}/?id=
 */

export const WEEK_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
export const INTERVAL_OPTIONS = [15, 30, 45, 60] as const
export const NOTICE_OPTIONS = [0, 1, 2, 4, 12, 24] as const
export const ADVANCE_OPTIONS = [7, 14, 30, 60, 90] as const
/** 0 means no cancellations are permitted (backend semantics). */
export const CANCELLATION_OPTIONS = [0, 2, 24, 48, 72] as const

export type ScheduleBreak = { id?: string; name: string; startTime: string; endTime: string }
export type ScheduleDay = { dayOfWeek: number; isClosed: boolean; openTime: string; closeTime: string; breaks: ScheduleBreak[] }

export type BookingSettings = {
  bookingInterval: number
  minNoticeHours: number
  maxAdvanceDays: number
  cancellationWindowHours: number
  allowFullPayment: boolean
  allowDeposit: boolean
  allowPayAtBusiness: boolean
  minDepositPercentage: number
  isDepositNonRefundable: boolean
  customPolicyText: string
}

export type BlockedTime = { id: string; date: string; startTime: string; endTime: string; reason: string; staffId: string | null }

/** Sink's fallbacks, for a business that has saved nothing yet. */
export const DEFAULT_SETTINGS: BookingSettings = {
  bookingInterval: 30, minNoticeHours: 2, maxAdvanceDays: 30, cancellationWindowHours: 2,
  allowFullPayment: true, allowDeposit: false, allowPayAtBusiness: false, minDepositPercentage: 30, isDepositNonRefundable: false, customPolicyText: '',
}

const defaultDay = (dayOfWeek: number): ScheduleDay => ({ dayOfWeek, isClosed: dayOfWeek === 6, openTime: '09:00', closeTime: '18:00', breaks: [] })

const payloadOf = (response: unknown) => {
  const record = asRecord(response)
  return record.data !== undefined ? record.data : response
}

const mapDay = (value: unknown): ScheduleDay => {
  const record = asRecord(value)
  return {
    dayOfWeek: num(record.day_of_week),
    isClosed: record.is_closed === true,
    openTime: normalizeTime(str(record.open_time) || '09:00'),
    closeTime: normalizeTime(str(record.close_time) || '18:00'),
    breaks: listFrom(record.breaks, []).map(entry => {
      const item = asRecord(entry)
      return { id: str(item.id) || undefined, name: str(item.name) || 'Break', startTime: normalizeTime(str(item.start_time)), endTime: normalizeTime(str(item.end_time)) }
    }),
  }
}

const toDayBody = (day: ScheduleDay) => ({
  day_of_week: day.dayOfWeek,
  is_closed: day.isClosed,
  open_time: day.openTime,
  close_time: day.closeTime,
  breaks: day.breaks.map(item => ({ ...(item.id ? { id: item.id } : {}), name: item.name, start_time: item.startTime, end_time: item.endTime })),
})

/** Always seven days: whatever the backend has, over the defaults. */
const completeWeek = (days: ScheduleDay[]) => WEEK_DAY_NAMES.map((_, dayOfWeek) => days.find(day => day.dayOfWeek === dayOfWeek) ?? defaultDay(dayOfWeek))

const getSchedule = async (businessId: string) => {
  if (!isLive()) return mockDelay(completeWeek(sample.schedule))
  const data = payloadOf(await apiRequest<unknown>(`service/schedule/${businessId}/`))
  return completeWeek(listFrom(data, ['schedules', 'results']).map(mapDay))
}

const saveSchedule = async (businessId: string, days: ScheduleDay[]) => {
  if (!isLive()) {
    sample.schedule = days
    return mockDelay(null)
  }
  return apiRequest<unknown>(`service/schedule/${businessId}/`, { method: 'PUT', body: { schedules: days.map(toDayBody) } })
}

const mapSettings = (value: unknown): BookingSettings => {
  const record = asRecord(value)
  return {
    bookingInterval: num(record.booking_interval) || DEFAULT_SETTINGS.bookingInterval,
    minNoticeHours: record.min_notice_hours === undefined ? DEFAULT_SETTINGS.minNoticeHours : num(record.min_notice_hours),
    maxAdvanceDays: num(record.max_advance_days) || DEFAULT_SETTINGS.maxAdvanceDays,
    cancellationWindowHours: record.cancellation_window_hours === undefined ? DEFAULT_SETTINGS.cancellationWindowHours : num(record.cancellation_window_hours),
    allowFullPayment: record.allow_full_payment === true,
    allowDeposit: record.allow_deposit === true,
    allowPayAtBusiness: record.allow_pay_at_business === true,
    minDepositPercentage: num(record.min_deposit_percentage) || DEFAULT_SETTINGS.minDepositPercentage,
    isDepositNonRefundable: record.is_deposit_non_refundable === true,
    customPolicyText: str(record.custom_policy_text),
  }
}

const SETTINGS_FIELDS: Record<keyof BookingSettings, string> = {
  bookingInterval: 'booking_interval', minNoticeHours: 'min_notice_hours', maxAdvanceDays: 'max_advance_days', cancellationWindowHours: 'cancellation_window_hours',
  allowFullPayment: 'allow_full_payment', allowDeposit: 'allow_deposit', allowPayAtBusiness: 'allow_pay_at_business', minDepositPercentage: 'min_deposit_percentage',
  isDepositNonRefundable: 'is_deposit_non_refundable', customPolicyText: 'custom_policy_text',
}

const getSettings = async (businessId: string) => {
  if (!isLive()) return mockDelay({ ...sample.settings })
  return mapSettings(payloadOf(await apiRequest<unknown>(`service/booking-settings/${businessId}/`)))
}

const saveSettings = async (businessId: string, patch: Partial<BookingSettings>) => {
  if (!isLive()) {
    sample.settings = { ...sample.settings, ...patch }
    return mockDelay(null)
  }
  const body: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) body[SETTINGS_FIELDS[key as keyof BookingSettings]] = key === 'customPolicyText' ? (value as string).trim() || null : value
  return apiRequest<unknown>(`service/booking-settings/${businessId}/`, { method: 'PATCH', body })
}

const mapBlockedTime = (value: unknown): BlockedTime => {
  const record = asRecord(value)
  return { id: str(record.id), date: str(record.date), startTime: normalizeTime(str(record.start_time)), endTime: normalizeTime(str(record.end_time)), reason: str(record.reason), staffId: str(record.staff_id) || null }
}

const getBlockedTimes = async (businessId: string, date: string) => {
  if (!isLive()) return mockDelay(sample.blockedTimes.filter(item => item.date === date), 200)
  const data = payloadOf(await apiRequest<unknown>(`service/blocked-times/${businessId}/?date=${encodeURIComponent(date)}`))
  return listFrom(data, ['results', 'data']).map(mapBlockedTime)
}

export type BlockedTimeInput = Omit<BlockedTime, 'id'>

const createBlockedTime = async (businessId: string, input: BlockedTimeInput) => {
  if (!isLive()) {
    sample.blockedTimes = [...sample.blockedTimes, { ...input, id: `sample-block-${Date.now()}` }]
    return mockDelay(null)
  }
  return apiRequest<unknown>(`service/blocked-times/${businessId}/`, { method: 'POST', body: { date: input.date, start_time: input.startTime, end_time: input.endTime, reason: input.reason, staff_id: input.staffId } })
}

const deleteBlockedTime = async (businessId: string, id: string) => {
  if (!isLive()) {
    sample.blockedTimes = sample.blockedTimes.filter(item => item.id !== id)
    return mockDelay(null, 300)
  }
  return apiRequest<unknown>(`service/blocked-times/${businessId}/?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export const useSchedule = () => {
  const { scope, enabled } = useBusinessScope()
  return useQuery({ queryKey: [...queryKeys.schedule, scope], queryFn: () => getSchedule(scope), enabled })
}

export const useSaveSchedule = () => {
  const { scope } = useBusinessScope()
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (days: ScheduleDay[]) => saveSchedule(scope, days), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.schedule }) })
}

export const useBookingSettings = () => {
  const { scope, enabled } = useBusinessScope()
  return useQuery({ queryKey: [...queryKeys.bookingSettings, scope], queryFn: () => getSettings(scope), enabled })
}

export const useSaveBookingSettings = () => {
  const { scope } = useBusinessScope()
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (patch: Partial<BookingSettings>) => saveSettings(scope, patch), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bookingSettings }) })
}

const blockedQuery = (scope: string, date: string) => ({ queryKey: [...queryKeys.blockedTimes, scope, date], queryFn: () => getBlockedTimes(scope, date), staleTime: 60 * 1000 })

/** The endpoint answers one date at a time, so a span of days is one cached request per date. */
export const useBlockedTimesForDates = (dates: string[]) => {
  const { scope, enabled } = useBusinessScope()
  return useQueries({
    queries: dates.map(date => ({ ...blockedQuery(scope, date), enabled })),
    combine: results => ({ blockedTimes: results.flatMap(result => result.data ?? []), isLoading: results.some(result => result.isLoading), isError: results.some(result => result.isError) }),
  })
}

export const useCreateBlockedTime = () => {
  const { scope } = useBusinessScope()
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (input: BlockedTimeInput) => createBlockedTime(scope, input), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.blockedTimes }) })
}

export const useDeleteBlockedTime = () => {
  const { scope } = useBusinessScope()
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (id: string) => deleteBlockedTime(scope, id), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.blockedTimes }) })
}
