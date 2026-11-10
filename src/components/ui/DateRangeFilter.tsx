import * as Popover from '@radix-ui/react-popover'
import { format } from 'date-fns'
import { Calendar, X } from 'lucide-react'
import { useState, type ChangeEvent, type ComponentProps } from 'react'
import { DayPicker, type DateRange, type DropdownProps } from 'react-day-picker'
import 'react-day-picker/style.css'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/cn'
import { Select } from './Select'

export type { DateRange }

type DateRangeFilterProps = {
  value: DateRange | undefined
  onChange: (value: DateRange | undefined) => void
  /** Pick one day instead of a range. */
  singleDay?: boolean
  placeholder?: string
  className?: string
  triggerClassName?: string
  align?: 'start' | 'end'
  /** Month and year dropdowns, for dates far from today (date of birth, registration date). */
  yearJump?: boolean
  /** Days that can't be picked, e.g. { after: new Date() }. */
  disabledDays?: ComponentProps<typeof DayPicker>['disabled']
}

const FIRST_YEAR = 1900

/** The month and year dropdowns inside the calendar use the app's Select too. */
function CaptionDropdown({ options, value, onChange, 'aria-label': ariaLabel }: DropdownProps) {
  return <Select aria-label={ariaLabel} searchable={false} value={String(value)} options={(options ?? []).map(option => ({ value: String(option.value), label: option.label, disabled: option.disabled }))} onValueChange={next => onChange?.({ target: { value: next } } as ChangeEvent<HTMLSelectElement>)} className="min-w-[92px]" boxClassName="h-8 rounded-lg px-2 text-xs"/>
}

/** Date range filter: sink-inventory's DatePickerWithRange, in this app's style. Two months on desktop, one on phones. */
export function DateRangeFilter({ value, onChange, singleDay = false, placeholder = 'Date range', className, triggerClassName, align = 'end', yearJump = false, disabledDays }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const year = new Date().getFullYear()
  const compact = (date: Date) => format(date, date.getFullYear() === year ? 'MMM d' : 'MMM d, yy')
  const oneDay = value?.from && (!value.to || value.from.toDateString() === value.to.toDateString())
  const label = value?.from ? (value.to && !oneDay ? `${compact(value.from)} – ${compact(value.to)}` : compact(value.from)) : placeholder
  const accent = { '--rdp-accent-color': '#173A2E', '--rdp-accent-background-color': 'rgba(216,255,114,.5)', '--rdp-day_button-width': '36px', '--rdp-day_button-height': '36px', '--rdp-day-width': '38px', '--rdp-day-height': '38px', fontSize: '13px' } as React.CSSProperties

  return <div className={cn('relative inline-flex min-w-0', className)}>
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" className={cn('flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-[#DFE7E2] bg-white px-3 text-xs font-bold outline-none transition hover:border-[#173A2E] focus-visible:border-[#173A2E]', open && 'border-[#173A2E]', value?.from ? 'text-[#09261C]' : 'text-[#7C8D85]', value?.from && 'pr-8', triggerClassName)}>
          <Calendar size={15} className="shrink-0"/><span className="truncate whitespace-nowrap">{label}</span>
        </button>
      </Popover.Trigger>
      {value?.from && <button type="button" aria-label="Clear dates" onClick={() => onChange(undefined)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#91A098] hover:text-[#C2483D]"><X size={14}/></button>}
      <Popover.Content align={align} sideOffset={6} collisionPadding={12} className="z-[70] max-h-[calc(100dvh-24px)] overflow-auto rounded-2xl border border-[#E2EAE5] bg-white p-3 shadow-[0_18px_44px_rgba(9,38,28,.16)]">
        {singleDay
          ? <DayPicker style={accent} mode="single" defaultMonth={value?.from} selected={value?.from} disabled={disabledDays} captionLayout={yearJump ? 'dropdown' : 'label'} startMonth={yearJump ? new Date(FIRST_YEAR, 0) : undefined} endMonth={yearJump ? new Date() : undefined} components={yearJump ? { Dropdown: CaptionDropdown } : undefined} onSelect={day => { onChange(day ? { from: day, to: day } : undefined); setOpen(false) }}/>
          : <DayPicker style={accent} mode="range" numberOfMonths={isDesktop ? 2 : 1} defaultMonth={value?.from} selected={value} disabled={disabledDays} onSelect={onChange}/>}
      </Popover.Content>
    </Popover.Root>
  </div>
}
