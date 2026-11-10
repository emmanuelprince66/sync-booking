import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { ADVANCE_OPTIONS, CANCELLATION_OPTIONS, DEFAULT_SETTINGS, INTERVAL_OPTIONS, NOTICE_OPTIONS, useBookingSettings, useSaveBookingSettings, type BookingSettings } from '@/api/availability'

type RuleKey = 'bookingInterval' | 'minNoticeHours' | 'maxAdvanceDays' | 'cancellationWindowHours'

const toOptions = (values: readonly number[], label: (value: number) => string) => values.map(value => ({ value: String(value), label: label(value) }))

const RULES: { key: RuleKey; label: string; options: { value: string; label: string }[] }[] = [
  { key: 'bookingInterval', label: 'Buffer between', options: toOptions(INTERVAL_OPTIONS, value => `${value} min`) },
  { key: 'minNoticeHours', label: 'Minimum notice', options: toOptions(NOTICE_OPTIONS, value => (value === 0 ? 'None' : value === 1 ? '1 hour' : `${value} hours`)) },
  { key: 'maxAdvanceDays', label: 'Book ahead', options: toOptions(ADVANCE_OPTIONS, value => `${value} days`) },
  { key: 'cancellationWindowHours', label: 'Cancel up to', options: toOptions(CANCELLATION_OPTIONS, value => (value === 0 ? 'No cancellations' : `${value} hours before`)) },
]

/** The design's booking rules card, editable, saved to booking-settings. */
export function useBookingRules() {
  const query = useBookingSettings()
  const save = useSaveBookingSettings()
  const [draft, setDraft] = useState<Partial<BookingSettings>>({})
  const settings = { ...DEFAULT_SETTINGS, ...query.data, ...draft }
  const isDirty = Object.keys(draft).length > 0
  return {
    isLoading: query.isLoading,
    rules: RULES.map(rule => ({ ...rule, value: String(settings[rule.key]) })),
    setRule: (key: RuleKey, value: string) => setDraft(current => ({ ...current, [key]: Number(value) })),
    isDirty,
    isSaving: save.isPending,
    saveRules: async () => {
      try {
        await save.mutateAsync(draft)
        setDraft({})
        toast.success('Booking rules saved')
      } catch (error) {
        toast.error(errorMessage(error, 'Could not save your booking rules.'))
      }
    },
  }
}
