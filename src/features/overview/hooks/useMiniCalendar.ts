import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { addDays, startOfWeek, toIsoDate, todayIso } from '@/lib/dates'
import { paths } from '@/routes/paths'

/** Month grid on the Overview, Monday first. Picking a day opens that week in the calendar. */
export function useMiniCalendar() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const today = todayIso()

  const days = useMemo(() => {
    const first = startOfWeek(month)
    const last = addDays(startOfWeek(new Date(month.getFullYear(), month.getMonth() + 1, 0)), 6)
    const count = Math.round((last.getTime() - first.getTime()) / 86_400_000) + 1
    return Array.from({ length: count }, (_, index) => {
      const date = addDays(first, index)
      const iso = toIsoDate(date)
      return { iso, label: date.getDate(), isToday: iso === today, inMonth: date.getMonth() === month.getMonth() }
    })
  }, [month, today])

  return {
    days,
    monthLabel: month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    todayLabel: `Today, ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`,
    previous: () => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1)),
    next: () => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1)),
    openDay: (iso: string) => navigate(`${paths.calendar}?date=${iso}`),
  }
}
