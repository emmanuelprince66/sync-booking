import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useSaveStorefront, WEEK_DAYS, type StorefrontProfile, type WeekDay } from '@/api/storefront'

export type DaysPreset = 'weekdays' | 'everyday' | 'custom'

const WEEKDAYS: WeekDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
const EVERY_DAY = WEEK_DAYS.map(day => day.value)

const sameDays = (a: WeekDay[], b: WeekDay[]) => a.length === b.length && a.every(day => b.includes(day))
const ordered = (days: WeekDay[]) => EVERY_DAY.filter(day => days.includes(day))

export const DAY_PRESETS: { value: DaysPreset; label: string }[] = [
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'everyday', label: 'Every day' },
  { value: 'custom', label: 'Custom' },
]

/** Opening days (working_days) and home-service days (delivery_days) shown on the booking page. */
export function useStoreDays(profile: StorefrontProfile) {
  const [workingDays, setWorkingDays] = useState<WeekDay[]>(profile.workingDays)
  const [homeDays, setHomeDays] = useState<WeekDay[]>(profile.deliveryDays)
  const [custom, setCustom] = useState(false)
  const save = useSaveStorefront()

  const preset: DaysPreset = custom ? 'custom' : sameDays(workingDays, WEEKDAYS) ? 'weekdays' : sameDays(workingDays, EVERY_DAY) ? 'everyday' : 'custom'
  const toggle = (list: WeekDay[], day: WeekDay) => ordered(list.includes(day) ? list.filter(item => item !== day) : [...list, day])

  return {
    days: WEEK_DAYS,
    workingDays,
    homeDays,
    preset,
    presets: DAY_PRESETS,
    setPreset: (value: DaysPreset) => {
      setCustom(value === 'custom')
      if (value === 'weekdays') setWorkingDays(WEEKDAYS)
      if (value === 'everyday') setWorkingDays(EVERY_DAY)
    },
    toggleWorkingDay: (day: WeekDay) => { setCustom(true); setWorkingDays(current => toggle(current, day)) },
    toggleHomeDay: (day: WeekDay) => setHomeDays(current => toggle(current, day)),
    dirty: !sameDays(workingDays, profile.workingDays) || !sameDays(homeDays, profile.deliveryDays),
    reset: () => { setWorkingDays(profile.workingDays); setHomeDays(profile.deliveryDays); setCustom(false) },
    submit: () => {
      if (!workingDays.length) { toast.error('Pick at least one opening day.'); return }
      save.mutate({ workingDays, deliveryDays: homeDays }, {
        onSuccess: () => toast.success('Opening days saved'),
        onError: error => toast.error(errorMessage(error, 'Could not save your days.')),
      })
    },
    saving: save.isPending,
  }
}

export type StoreDaysModel = ReturnType<typeof useStoreDays>
