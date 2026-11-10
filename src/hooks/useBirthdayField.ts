import { useEffect, useMemo, useRef, useState } from 'react'
import { BIRTH_MONTHS, daysInMonth, formatBirthday, parseBirthday, type BirthdayParts } from '@/lib/birthday'

const YEARS_BACK = 100

/**
 * Day, month and optional year. The three picks live here rather than in the value: the value stays ""
 * until a day and month are both set, and reading the picks back out of that would undo the first one.
 */
export function useBirthdayField(value: string, onChange: (value: string) => void) {
  const [parts, setParts] = useState(() => parseBirthday(value))
  const lastEmitted = useRef(formatBirthday(parseBirthday(value)))

  // Follows changes from outside (a reset, "Fill in details"), not the echo of its own emits.
  useEffect(() => {
    if (value === lastEmitted.current) return
    lastEmitted.current = value
    setParts(parseBirthday(value))
  }, [value])

  const dayCount = daysInMonth(parts.month, parts.year)
  const dayOptions = useMemo(() => Array.from({ length: dayCount }, (_, index) => { const day = String(index + 1).padStart(2, '0'); return { value: day, label: String(index + 1) } }), [dayCount])
  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear()
    return [{ value: '', label: 'No year' }, ...Array.from({ length: YEARS_BACK + 1 }, (_, index) => ({ value: String(current - index), label: String(current - index) }))]
  }, [])

  const update = (next: Partial<BirthdayParts>) => {
    const merged = { ...parts, ...next }
    // Drops a day the new month can't have (31, then February).
    if (Number(merged.day) > daysInMonth(merged.month, merged.year)) merged.day = ''
    setParts(merged)
    const emitted = formatBirthday(merged)
    lastEmitted.current = emitted
    onChange(emitted)
  }

  return {
    parts,
    dayOptions,
    monthOptions: BIRTH_MONTHS,
    yearOptions,
    setDay: (day: string) => update({ day }),
    setMonth: (month: string) => update({ month }),
    setYear: (year: string) => update({ year }),
  }
}
