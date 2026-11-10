import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useSaveSchedule, useSchedule, WEEK_DAY_NAMES, type ScheduleBreak, type ScheduleDay } from '@/api/availability'

/** Weekly hours and breaks. Edits stay local until "Save hours" (PUT schedule, all seven days). */
export function useWeeklyHours() {
  const query = useSchedule()
  const save = useSaveSchedule()
  const [draft, setDraft] = useState<ScheduleDay[] | null>(null)
  const days = draft ?? query.data ?? []

  const updateDay = (dayOfWeek: number, patch: Partial<ScheduleDay>) =>
    setDraft(days.map(day => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day)))

  const updateBreaks = (day: ScheduleDay, breaks: ScheduleBreak[]) => updateDay(day.dayOfWeek, { breaks })

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    retry: () => void query.refetch(),
    rows: days.map(day => ({ day, name: WEEK_DAY_NAMES[day.dayOfWeek] ?? '' })),
    toggleDay: (day: ScheduleDay) => updateDay(day.dayOfWeek, { isClosed: !day.isClosed }),
    setOpenTime: (day: ScheduleDay, openTime: string) => updateDay(day.dayOfWeek, { openTime }),
    setCloseTime: (day: ScheduleDay, closeTime: string) => updateDay(day.dayOfWeek, { closeTime }),
    addBreak: (day: ScheduleDay) => updateBreaks(day, [...day.breaks, { name: 'Break', startTime: '13:00', endTime: '14:00' }]),
    updateBreak: (day: ScheduleDay, index: number, patch: Partial<ScheduleBreak>) => updateBreaks(day, day.breaks.map((item, position) => (position === index ? { ...item, ...patch } : item))),
    removeBreak: (day: ScheduleDay, index: number) => updateBreaks(day, day.breaks.filter((_, position) => position !== index)),
    isSaving: save.isPending,
    saveHours: async () => {
      const invalid = days.find(day => !day.isClosed && day.closeTime <= day.openTime)
      if (invalid) {
        toast.error(`${WEEK_DAY_NAMES[invalid.dayOfWeek]}: closing time must be after opening time.`)
        return
      }
      try {
        await save.mutateAsync(days)
        setDraft(null)
        toast.success('Weekly hours saved')
      } catch (error) {
        toast.error(errorMessage(error, 'Could not save your hours.'))
      }
    },
  }
}
