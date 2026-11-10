import { timeSelectOptions } from '@/lib/dates'
import { Select } from './Select'

/** The design's small mono time button, in 24-hour time whatever the browser's locale. */
export function TimeSelect({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return <Select aria-label={label} value={value} options={timeSelectOptions(value)} onValueChange={onChange} className="w-[92px]" boxClassName="h-9 rounded-lg px-2.5 font-mono text-xs font-bold"/>
}
