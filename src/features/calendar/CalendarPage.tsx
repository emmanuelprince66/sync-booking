import { CalendarDays, ChevronLeft, ChevronRight, Plus, TimerOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { EmptyState, ErrorState, PageTitle } from '@/components/ui/misc'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { BookingRow, BookingRowsSkeleton } from '@/features/bookings/components/BookingRow'
import { cn } from '@/lib/cn'
import { HOUR_HEIGHT, useCalendar } from './hooks/useCalendar'

type CalendarModel = ReturnType<typeof useCalendar>

function WeekGrid({ page }: { page: CalendarModel }) {
  const columns = page.days.length
  const template = { gridTemplateColumns: `80px repeat(${columns}, minmax(0, 1fr))` }
  const columnWidth = `(100% - 80px) / ${columns}`
  return <div className="hidden overflow-x-auto rounded-2xl border border-border bg-white md:block">
    <div className="min-w-[850px]">
      <div className="grid border-b border-border" style={template}>
        <div className="p-4"/>
        {page.days.map(day => <div key={day.iso} className={cn('border-l border-border p-4 text-center', day.isToday && 'bg-[#F4FFE0]')}><p className="font-mono text-[11px] font-bold text-[#7C9187]">{day.weekday}</p><p className={cn('mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full text-sm font-black', day.isToday ? 'bg-[#173A2E] text-white' : 'text-[#173A2E]')}>{day.dayNumber}</p></div>)}
      </div>
      <div className="relative">
        {page.hours.map(time => <div key={time} className="grid border-b border-border last:border-0" style={{ ...template, height: HOUR_HEIGHT }}><span className="px-4 pt-2 font-mono text-[10px] font-bold text-[#9AABA3]">{time}</span>{page.days.map(day => <div key={day.iso} className={cn('border-l border-border', day.isToday && 'bg-[#FBFFF4]')}/>)}</div>)}
        {page.events.map(event => {
          const laneWidth = `((${columnWidth} - 12px) / ${event.lanes})`
          const style = { top: event.top + 3, height: event.height, left: `calc(80px + ${columnWidth} * ${event.dayIndex} + 6px + ${laneWidth} * ${event.lane})`, width: `calc(${laneWidth} - 2px)` }
          const body = <><p className="truncate text-xs font-black text-[#173A2E]">{event.title}</p><p className="mt-1 truncate font-mono text-[10px] text-[#527065]">{event.subtitle}</p></>
          return event.kind === 'booking'
            ? <button key={event.key} type="button" onClick={() => page.openBooking(event.bookingId as string)} style={style} className={cn('absolute flex flex-col justify-start overflow-hidden rounded-xl border-l-4 p-3 text-left shadow-sm transition hover:brightness-[.98]', event.tone)}>{body}</button>
            : <div key={event.key} style={style} className={cn('absolute overflow-hidden rounded-xl border-l-4 p-3', event.tone)}>{body}</div>
        })}
      </div>
    </div>
  </div>
}

function DayAgenda({ page }: { page: CalendarModel }) {
  return <div className="flex flex-col gap-3 md:hidden">
    <div className="grid grid-cols-7 gap-1">{page.dayRow.map(day => <button key={day.iso} type="button" aria-pressed={day.isSelected} onClick={() => page.selectDay(day.iso)} className={cn('flex min-w-0 flex-col items-center gap-1 rounded-xl border py-2', day.isSelected ? 'border-[#173A2E] bg-[#173A2E] text-white' : 'border-border bg-white text-[#173A2E]')}><span className={cn('font-mono text-[10px] font-bold uppercase', day.isSelected ? 'text-white/60' : 'text-[#7C9187]')}>{day.weekday}</span><span className="text-sm font-black">{day.dayNumber}</span></button>)}</div>
    <div className="rounded-2xl border border-border bg-white px-5">
      {page.isLoading
        ? <BookingRowsSkeleton rows={3}/>
        : <>
          {page.dayBlocked.map(item => <div key={item.id} className="flex items-center gap-3 border-b border-border py-3.5 last:border-0"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EFF2F0] text-[#657C71]"><TimerOff size={16}/></span><div className="min-w-0"><p className="truncate text-sm font-extrabold text-[#203B31]">{item.reason || 'Blocked time'}</p><p className="font-mono text-[10px] text-[#93A39C]">{item.startTime}–{item.endTime}</p></div></div>)}
          {page.dayBookings.map(booking => <BookingRow key={booking.id} booking={booking} onView={page.openBooking}/>)}
          {page.dayBlocked.length === 0 && page.dayBookings.length === 0 && <EmptyState icon={<CalendarDays size={20}/>} title="Nothing booked this day"/>}
        </>}
    </div>
  </div>
}

function WeekSkeleton() {
  return <SkeletonGroup label="Loading calendar" className="hidden rounded-2xl border border-border bg-white p-4 md:block">
    <div className="grid grid-cols-6 gap-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-14"/>)}</div>
    <Skeleton className="mt-4 h-[420px] w-full rounded-xl"/>
  </SkeletonGroup>
}

export default function CalendarPage() {
  const page = useCalendar()
  return <div className="mx-auto max-w-[1192px] p-5 md:p-8">
    <PageTitle title="Calendar" subtitle="See your week, your way." actions={<>
      <DateRangeFilter singleDay value={page.jumpValue} onChange={page.jumpTo} placeholder="Go to date" align="end" triggerClassName="h-11 text-sm"/>
      <Button variant="outline" onClick={page.goToToday}>Today</Button>
      {page.canAddBooking && <Button onClick={page.openNewBooking}><Plus size={17}/> New booking</Button>}
    </>}/>
    <div className="mb-4 flex items-center justify-between gap-3">
      <p className="truncate text-sm font-black text-[#173A2E]">{page.rangeLabel}</p>
      <div className="flex shrink-0 gap-1">
        <button type="button" aria-label="Previous week" onClick={page.previousWeek} className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-white"><ChevronLeft size={15}/></button>
        <button type="button" aria-label="Next week" onClick={page.nextWeek} className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-white"><ChevronRight size={15}/></button>
      </div>
    </div>
    {page.isError
      ? <ErrorState title="We couldn’t load your calendar" onRetry={page.retry}/>
      : <>
        {page.isLoading ? <WeekSkeleton/> : <WeekGrid page={page}/>}
        <DayAgenda page={page}/>
      </>}
  </div>
}
