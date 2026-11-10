/** Local-time date helpers. The API deals in plain "yyyy-MM-dd" dates and "HH:mm" times with no timezone. */

export const toIsoDate = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export const fromIsoDate = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year || 1970, (month || 1) - 1, day || 1)
}

export const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)

export const todayIso = () => toIsoDate(new Date())

/** Monday of the date's week. */
export const startOfWeek = (date: Date) => addDays(date, -weekdayIndex(date))

/** Monday = 0 … Sunday = 6: the backend's day_of_week. */
export const weekdayIndex = (date: Date) => (date.getDay() + 6) % 7

/** "09:00", from "09:00:00", "9:00" or "1:30 PM". */
export const normalizeTime = (value: string) => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*(AM|PM)?$/i)
  if (!match) return value
  let hours = Number(match[1])
  if (match[3]?.toUpperCase() === 'PM' && hours < 12) hours += 12
  if (match[3]?.toUpperCase() === 'AM' && hours === 12) hours = 0
  return `${String(hours).padStart(2, '0')}:${match[2]}`
}

export const timeToMinutes = (time: string) => {
  const [hours, minutes] = normalizeTime(time).split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

export const minutesToTime = (total: number) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`

const QUARTER_HOURS = Array.from({ length: 96 }, (_, index) => minutesToTime(index * 15))

/** Every quarter hour, plus the current value when the backend holds something in between. */
export const timeOptionsFor = (value: string) => (QUARTER_HOURS.includes(value) ? QUARTER_HOURS : [...QUARTER_HOURS, value].sort())

/** The same list as dropdown options, for time fields. */
export const timeSelectOptions = (value: string) => timeOptionsFor(value).map(time => ({ value: time, label: time }))

/** "1h 30m", "45m", "3h": the booking rows. */
export const durationShort = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return [hours ? `${hours}h` : '', rest ? `${rest}m` : ''].filter(Boolean).join(' ') || '0m'
}

/** "1 hr 30 min", "3 hours", "45 minutes": the service cards. */
export const durationLong = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} minutes`
  if (!rest) return hours === 1 ? '1 hour' : `${hours} hours`
  return `${hours} hr ${rest} min`
}

const shortDate = (date: Date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

/** "Today, 19 Jun", "Tomorrow, 20 Jun", "Mon, 23 Jun". */
export const relativeDayLabel = (iso: string) => {
  const date = fromIsoDate(iso)
  const today = new Date()
  if (iso === toIsoDate(today)) return `Today, ${shortDate(date)}`
  if (iso === toIsoDate(addDays(today, 1))) return `Tomorrow, ${shortDate(date)}`
  if (iso === toIsoDate(addDays(today, -1))) return `Yesterday, ${shortDate(date)}`
  return `${date.toLocaleDateString('en-GB', { weekday: 'short' })}, ${shortDate(date)}`
}

/** "Thursday, 19 June". */
export const weekdayDayMonth = (date: Date) => date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
