import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useBlockedTimesForDates, useCreateBlockedTime, useDeleteBlockedTime, type BlockedTime } from '@/api/availability'
import type { DateRange } from '@/components/ui/DateRangeFilter'
import { addDays, fromIsoDate, timeSelectOptions, toIsoDate, todayIso } from '@/lib/dates'
import { blockTimeSchema, type BlockTimeValues } from '../schemas'

/** The endpoint answers one date at a time, so "upcoming" is the next two weeks, one cached request per day. */
const UPCOMING_DAYS = 14
/** A picked range is capped, since every day in it is one request. */
const MAX_RANGE_DAYS = 31

const datesInRange = (from: Date, to: Date) => {
  const days: string[] = []
  for (let day = from; day <= to && days.length < MAX_RANGE_DAYS; day = addDays(day, 1)) days.push(toIsoDate(day))
  return days
}

const dayLabel = (iso: string) => fromIsoDate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })

export function useTimeOff() {
  const [range, setRange] = useState<DateRange | undefined>()
  const dates = useMemo(() => (range?.from
    ? datesInRange(range.from, range.to ?? range.from)
    : Array.from({ length: UPCOMING_DAYS }, (_, index) => toIsoDate(addDays(new Date(), index)))), [range])
  const isCapped = Boolean(range?.from && range.to && dates.length === MAX_RANGE_DAYS && dates[dates.length - 1] !== toIsoDate(range.to))
  const blocked = useBlockedTimesForDates(dates)
  const remove = useDeleteBlockedTime()
  const [modalOpen, setModalOpen] = useState(false)

  const items = [...blocked.blockedTimes].sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
  return {
    title: range?.from ? 'Time off' : 'Upcoming time off',
    range,
    setRange,
    rangeNote: isCapped ? `Showing the first ${MAX_RANGE_DAYS} days of this range.` : '',
    emptyText: range?.from ? 'Nothing blocked in these dates.' : 'Nothing blocked in the next two weeks.',
    isLoading: blocked.isLoading,
    items: items.map((item: BlockedTime) => ({ id: item.id, when: `${dayLabel(item.date)} · ${item.startTime}–${item.endTime}`, reason: item.reason || 'Blocked time' })),
    removingId: remove.isPending ? remove.variables : null,
    removeItem: async (id: string) => {
      try {
        await remove.mutateAsync(id)
        toast.success('Time off removed')
      } catch (error) {
        toast.error(errorMessage(error, 'Could not remove this time off.'))
      }
    },
    modalOpen,
    openModal: () => setModalOpen(true),
    closeModal: () => setModalOpen(false),
  }
}

/** Mounted with the dialog, so it opens blank. */
export function useBlockTimeForm(onClose: () => void) {
  const create = useCreateBlockedTime()
  const form = useForm<BlockTimeValues>({ resolver: zodResolver(blockTimeSchema), defaultValues: { title: '', date: todayIso(), startTime: '12:00', endTime: '16:00', note: '' } })
  const startTime = useWatch({ control: form.control, name: 'startTime' })
  const endTime = useWatch({ control: form.control, name: 'endTime' })
  return {
    control: form.control,
    register: form.register,
    errors: form.formState.errors,
    startTimeOptions: timeSelectOptions(startTime),
    endTimeOptions: timeSelectOptions(endTime),
    isSubmitting: create.isPending,
    onSubmit: form.handleSubmit(async values => {
      try {
        // Same payload as sink's Block time page: the note folds into `reason`.
        await create.mutateAsync({ date: values.date, startTime: values.startTime, endTime: values.endTime, reason: [values.title.trim(), values.note.trim()].filter(Boolean).join(' — '), staffId: null })
        toast.success(`Time block added to ${dayLabel(values.date)}`)
        onClose()
      } catch (error) {
        toast.error(errorMessage(error, 'Could not add this time block.'))
      }
    }),
  }
}
