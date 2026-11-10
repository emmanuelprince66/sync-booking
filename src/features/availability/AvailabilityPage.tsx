import { Check, Clock3, Plus, TimerOff, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { Field, TextareaField } from '@/components/ui/Field'
import { FormDateField } from '@/components/ui/FormDateField'
import { ErrorState, PageTitle } from '@/components/ui/misc'
import { FormModal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { CardSkeleton, Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { TimeSelect } from '@/components/ui/TimeSelect'
import { Toggle } from '@/components/ui/Toggle'
import { useBookingRules } from './hooks/useBookingRules'
import { useBlockTimeForm, useTimeOff } from './hooks/useTimeOff'
import { useWeeklyHours } from './hooks/useWeeklyHours'

function WeeklyHoursCard() {
  const hours = useWeeklyHours()
  return <div className="min-w-0 rounded-2xl border border-border bg-white">
    <div className="border-b border-border p-5"><h3 className="text-base font-black text-[#173A2E]">Weekly hours</h3><p className="mt-1 text-xs font-semibold text-[#879A91]">These hours repeat every week.</p></div>
    {hours.isError
      ? <ErrorState title="We couldn’t load your hours" onRetry={hours.retry} className="m-5"/>
      : hours.isLoading
        ? <SkeletonGroup label="Loading hours" className="divide-y divide-border px-5">{Array.from({ length: 7 }, (_, index) => <div key={index} className="flex min-h-[70px] items-center gap-4 py-3"><Skeleton className="h-6 w-11 rounded-full"/><Skeleton className="h-3.5 w-24"/><Skeleton className="h-8 w-40 max-w-full"/></div>)}</SkeletonGroup>
        : <div className="divide-y divide-border px-5">
          {hours.rows.map(({ day, name }) => <div key={day.dayOfWeek} className="flex min-h-[70px] flex-col justify-center gap-2 py-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Toggle enabled={!day.isClosed} label={`${name} open`} onChange={() => hours.toggleDay(day)}/>
              <span className="w-24 text-sm font-extrabold text-[#2C473C]">{name}</span>
              {day.isClosed
                ? <span className="text-xs font-bold text-[#A0AEA7]">Unavailable</span>
                : <div className="flex flex-wrap items-center gap-2">
                  <TimeSelect label={`${name} opening time`} value={day.openTime} onChange={value => hours.setOpenTime(day, value)}/>
                  <span className="text-[#A1B0A9]">—</span>
                  <TimeSelect label={`${name} closing time`} value={day.closeTime} onChange={value => hours.setCloseTime(day, value)}/>
                  <button type="button" onClick={() => hours.addBreak(day)} className="flex items-center gap-1 text-[11px] font-black text-[#24764F]"><Plus size={13}/> Break</button>
                </div>}
            </div>
            {!day.isClosed && day.breaks.map((item, index) => <div key={index} className="flex flex-wrap items-center gap-2 sm:pl-[60px]">
              <input aria-label="Break name" value={item.name} onChange={event => hours.updateBreak(day, index, { name: event.target.value })} className="w-24 rounded-lg border border-border bg-[#F9FBF8] px-2 py-2 text-xs font-bold text-[#405B50] outline-none focus:border-[#329661]"/>
              <TimeSelect label="Break start" value={item.startTime} onChange={value => hours.updateBreak(day, index, { startTime: value })}/>
              <span className="text-[#A1B0A9]">—</span>
              <TimeSelect label="Break end" value={item.endTime} onChange={value => hours.updateBreak(day, index, { endTime: value })}/>
              <button type="button" aria-label="Remove break" onClick={() => hours.removeBreak(day, index)} className="grid h-7 w-7 place-items-center rounded-lg text-[#82988E] hover:bg-[#F0F4F1]"><X size={14}/></button>
            </div>)}
          </div>)}
        </div>}
    <div className="flex justify-end border-t border-border p-4"><Button onClick={() => void hours.saveHours()} loading={hours.isSaving} disabled={hours.isLoading}><Check size={16}/> Save hours</Button></div>
  </div>
}

function BookingRulesCard() {
  const rules = useBookingRules()
  if (rules.isLoading) return <CardSkeleton lines={4}/>
  return <div className="rounded-2xl border border-border bg-white p-5">
    <div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#E5E0FF] text-[#6C59C3]"><Clock3 size={17}/></span><div><h3 className="text-sm font-black text-[#173A2E]">Booking rules</h3><p className="text-[11px] font-semibold text-[#8A9C93]">Protect your schedule</p></div></div>
    {rules.rules.map(rule => <div key={rule.key} className="flex items-center justify-between gap-3 border-t border-border py-2.5 text-xs">
      <span className="font-bold text-[#71867C]">{rule.label}</span>
      <Select aria-label={rule.label} searchable={false} value={rule.value} options={rule.options} onValueChange={value => rules.setRule(rule.key, value)} className="w-[150px] max-w-[60%]" boxClassName="h-9 rounded-lg px-2.5 text-xs font-black"/>
    </div>)}
    {rules.isDirty && <Button onClick={() => void rules.saveRules()} loading={rules.isSaving} className="mt-2 w-full"><Check size={16}/> Save rules</Button>}
  </div>
}

function BlockTimeModal({ onClose }: { onClose: () => void }) {
  const form = useBlockTimeForm(onClose)
  return <FormModal open onClose={onClose} eyebrow="Availability" title="Block time" description="One-off periods when clients can’t book." onSubmit={form.onSubmit} footer={<>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button type="submit" loading={form.isSubmitting}>Block time</Button>
  </>}>
    <div className="flex flex-col gap-4">
      <Field label="Title" placeholder="Personal appointment" error={form.errors.title?.message} {...form.register('title')}/>
      <FormDateField control={form.control} name="date" label="Date"/>
      <div className="grid grid-cols-2 gap-4">
        <Select label="From" options={form.startTimeOptions} error={form.errors.startTime?.message} {...form.register('startTime')}/>
        <Select label="To" options={form.endTimeOptions} error={form.errors.endTime?.message} {...form.register('endTime')}/>
      </div>
      <TextareaField label="Note (optional)" rows={2} {...form.register('note')}/>
    </div>
  </FormModal>
}

/** Availability: weekly hours, breaks, booking rules and blocked time. */
export default function AvailabilityPage() {
  const timeOff = useTimeOff()
  return <div className="mx-auto max-w-[1050px] p-5 md:p-8">
    <PageTitle title="Availability" subtitle="Set your rhythm. We will handle the slots." actions={<Button variant="secondary" onClick={timeOff.openModal}><TimerOff size={17}/> Block time</Button>}/>
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
      <WeeklyHoursCard/>
      <div className="flex min-w-0 flex-col gap-4">
        <BookingRulesCard/>
        <div className="rounded-2xl bg-[#FFE1AD] p-5">
          <TimerOff size={20} className="mb-3 text-[#8A5A00]"/>
          <h3 className="text-sm font-black text-[#4F3A12]">{timeOff.title}</h3>
          <DateRangeFilter value={timeOff.range} onChange={timeOff.setRange} align="start" placeholder="Next two weeks" className="mt-3 flex w-full" triggerClassName="w-full border-transparent bg-white/70"/>
          {timeOff.rangeNote && <p className="mt-1.5 text-[11px] font-bold text-[#795F30]">{timeOff.rangeNote}</p>}
          {timeOff.isLoading
            ? <div className="mt-3 flex flex-col gap-2"><Skeleton className="h-3 w-40 bg-white/50"/><Skeleton className="h-3 w-28 bg-white/50"/></div>
            : timeOff.items.length === 0
              ? <p className="mt-3 text-xs font-bold leading-relaxed text-[#795F30]">{timeOff.emptyText}</p>
              : <div className="mt-3 flex flex-col gap-2">{timeOff.items.map(item => <div key={item.id} className="flex items-start justify-between gap-2">
                <p className="min-w-0 break-words text-xs font-bold leading-relaxed text-[#795F30]">{item.when}<br/>{item.reason}</p>
                <button type="button" aria-label={`Remove ${item.reason}`} disabled={timeOff.removingId === item.id} onClick={() => void timeOff.removeItem(item.id)} className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[#795F30] hover:bg-white/40 disabled:opacity-40"><X size={14}/></button>
              </div>)}</div>}
        </div>
      </div>
    </div>
    {timeOff.modalOpen && <BlockTimeModal onClose={timeOff.closeModal}/>}
  </div>
}
