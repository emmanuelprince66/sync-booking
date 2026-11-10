/**
 * Birthdays with the year optional (sink's utils/birthday.ts): what they feed only needs the day and
 * month, and plenty of people will give those two and not their age.
 * The value is a full "YYYY-MM-DD" or a year-less "MM-DD".
 */

export type BirthdayParts = { day: string; month: string; year: string }

export const BIRTH_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  .map((label, index) => ({ value: String(index + 1).padStart(2, '0'), label }))

const pad = (value: string) => value.padStart(2, '0')

/** With no year, February gets 29: nothing rules out a leap day. */
export const daysInMonth = (month: string, year: string) => {
  const monthNumber = Number(month)
  if (!monthNumber) return 31
  if (!Number(year)) return monthNumber === 2 ? 29 : new Date(2000, monthNumber, 0).getDate()
  return new Date(Number(year), monthNumber, 0).getDate()
}

export const parseBirthday = (value?: string | null): BirthdayParts => {
  const text = String(value ?? '').trim()
  const full = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text)
  if (full) return { year: full[1], month: pad(full[2]), day: pad(full[3]) }
  const yearless = /^-{0,2}(\d{1,2})-(\d{1,2})$/.exec(text)
  if (yearless) return { year: '', month: pad(yearless[1]), day: pad(yearless[2]) }
  return { day: '', month: '', year: '' }
}

/** Empty until both the day and the month are set: half a birthday is no birthday. */
export const formatBirthday = ({ day, month, year }: BirthdayParts) => {
  if (!day || !month) return ''
  return year ? `${year}-${month}-${day}` : `${month}-${day}`
}
