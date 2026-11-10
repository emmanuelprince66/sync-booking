import { useBirthdayField } from '@/hooks/useBirthdayField'
import { fieldLabelClass } from './Field'
import { Select } from './Select'

const compact = 'px-2 text-[13px]'

/** Sink's BirthdayField: day and month are enough, the year is optional. */
export function BirthdayField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const field = useBirthdayField(value, onChange)
  return <div className="min-w-0">
    <span className={fieldLabelClass}>{label}</span>
    <div className="grid grid-cols-[minmax(0,.8fr)_minmax(0,1.3fr)_minmax(0,1fr)] gap-1.5">
      <Select aria-label="Birth day" placeholder="Day" searchable={false} value={field.parts.day} options={field.dayOptions} onValueChange={field.setDay} boxClassName={compact}/>
      <Select aria-label="Birth month" placeholder="Month" searchable={false} value={field.parts.month} options={field.monthOptions} onValueChange={field.setMonth} boxClassName={compact}/>
      <Select aria-label="Birth year" placeholder="Year" searchable={false} value={field.parts.year} options={field.yearOptions} onValueChange={field.setYear} boxClassName={compact}/>
    </div>
  </div>
}
