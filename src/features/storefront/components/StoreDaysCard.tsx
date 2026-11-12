import { CalendarDays } from 'lucide-react'
import { Link } from 'react-router'
import type { WeekDay } from '@/api/storefront'
import { PillTabs } from '@/components/ui/misc'
import { cn } from '@/lib/cn'
import { servicesPath } from '@/routes/paths'
import type { StoreDaysModel } from '../hooks/useStoreDays'
import { CardActions, SettingsCard } from './SettingsCard'

function DayChips({ label, days, selected, onToggle }: { label: string; days: StoreDaysModel['days']; selected: WeekDay[]; onToggle: (day: WeekDay) => void }) {
  return <div role="group" aria-label={label} className="grid grid-cols-7 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
    {days.map(day => {
      const on = selected.includes(day.value)
      return <button key={day.value} type="button" aria-pressed={on} onClick={() => onToggle(day.value)} className={cn('rounded-xl py-2.5 text-[11px] font-extrabold transition sm:min-w-[56px] sm:px-3', on ? 'bg-[#173A2E] text-white' : 'border border-border bg-white text-[#72877D] hover:border-[#329661]')}>{day.short}</button>
    })}
  </div>
}

export function StoreDaysCard({ days }: { days: StoreDaysModel }) {
  return <SettingsCard icon={CalendarDays} title="Opening days" description="Shown on your booking page so clients know when you’re open.">
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-extrabold text-[#29483B]">Open on</span>
          <PillTabs value={days.preset} onChange={days.setPreset} options={days.presets} className="self-start"/>
        </div>
        <DayChips label="Opening days" days={days.days} selected={days.workingDays} onToggle={days.toggleWorkingDay}/>
        <p className="mt-2 text-[11px] font-semibold text-[#8A9C93]">Bookable hours and breaks are set in <Link to={servicesPath('availability')} className="font-extrabold text-[#24764F] hover:underline">Availability</Link>.</p>
      </div>
      <div>
        <p className="text-sm font-extrabold text-[#29483B]">Home service days</p>
        <p className="mb-3 mt-0.5 text-[11px] font-semibold text-[#8A9C93]">Days you travel to clients. Leave empty if you only see clients at your space.</p>
        <DayChips label="Home service days" days={days.days} selected={days.homeDays} onToggle={days.toggleHomeDay}/>
      </div>
    </div>
    <CardActions dirty={days.dirty} saving={days.saving} onReset={days.reset} onSave={days.submit} saveLabel="Save days"/>
  </SettingsCard>
}
