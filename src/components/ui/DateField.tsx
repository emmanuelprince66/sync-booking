import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { fromIsoDate, toIsoDate } from '@/lib/dates'
import { DateRangeFilter } from './DateRangeFilter'
import { fieldErrorClass, fieldLabelClass } from './Field'

type DateFieldProps = {
  label: string
  /** "yyyy-MM-dd", or "" when unset. */
  value: string
  onValueChange: (value: string) => void
  error?: string
  placeholder?: string
  className?: string
  yearJump?: boolean
  disabledDays?: ComponentProps<typeof DateRangeFilter>['disabledDays']
}

/** One date in a form: the app's calendar popover with a trigger the height of the fields around it. */
export function DateField({ label, value, onValueChange, error, placeholder = 'Pick a date', className, yearJump, disabledDays }: DateFieldProps) {
  const date = value ? fromIsoDate(value) : undefined
  return <div className={cn('min-w-0', className)}>
    <span className={fieldLabelClass}>{label}</span>
    <DateRangeFilter singleDay align="start" placeholder={placeholder} yearJump={yearJump} disabledDays={disabledDays} value={date ? { from: date, to: date } : undefined} onChange={range => onValueChange(range?.from ? toIsoDate(range.from) : '')} className="flex w-full" triggerClassName={cn('h-[46px] w-full border-border bg-[#FBFCFA] text-sm', error && 'border-[#C2483D]')}/>
    {error && <span role="alert" className={fieldErrorClass}>{error}</span>}
  </div>
}
