import { ArrowRight, CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, Plus, TimerOff } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { EmptyState, ErrorState } from '@/components/ui/misc'
import { Skeleton } from '@/components/ui/Skeleton'
import { BookingRow, BookingRowsSkeleton } from '@/features/bookings/components/BookingRow'
import { cn } from '@/lib/cn'
import { paths } from '@/routes/paths'
import { useMiniCalendar } from './hooks/useMiniCalendar'
import { useOverview } from './hooks/useOverview'

const WEEK_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function MiniCalendar() {
  const calendar = useMiniCalendar()
  return <div className="rounded-2xl border border-border bg-white p-5">
    <div className="mb-4 flex items-center justify-between">
      <div><p className="text-xs font-bold text-[#82988E]">{calendar.monthLabel}</p><p className="text-base font-black text-[#173A2E]">{calendar.todayLabel}</p></div>
      <div className="flex gap-1">
        <button type="button" aria-label="Previous month" onClick={calendar.previous} className="grid h-8 w-8 place-items-center rounded-lg border border-border"><ChevronLeft size={15}/></button>
        <button type="button" aria-label="Next month" onClick={calendar.next} className="grid h-8 w-8 place-items-center rounded-lg border border-border"><ChevronRight size={15}/></button>
      </div>
    </div>
    <div className="grid grid-cols-7 gap-y-1 text-center">
      {WEEK_LETTERS.map((letter, index) => <span key={index} className="py-1 text-[10px] font-black text-[#A3B1AA]">{letter}</span>)}
      {calendar.days.map(day => <button key={day.iso} type="button" onClick={() => calendar.openDay(day.iso)} className={cn('mx-auto grid h-8 w-8 place-items-center rounded-full text-xs font-bold', day.isToday ? 'bg-[#173A2E] text-white shadow-md' : !day.inMonth ? 'text-[#CBD4CF]' : 'text-[#4A6258] hover:bg-[#EEF4EC]')}>{day.label}</button>)}
    </div>
  </div>
}

export default function OverviewPage() {
  const page = useOverview()
  return <div className="mx-auto flex max-w-[1192px] flex-col gap-6 p-5 md:p-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0"><p className="mb-1 text-sm font-bold text-[#6F877B]">{page.dateLabel}</p><h1 className="text-3xl font-black tracking-[-0.035em] text-[#173A2E]">Overview</h1><p className="mt-1 text-sm font-semibold text-[#71867C]">{page.tagline}</p></div>
      <Button onClick={page.openNewBooking} className="shrink-0"><Plus size={17}/> New booking</Button>
    </div>

    <section className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {page.cards.map(card => {
        const CardIcon = card.icon
        return <div key={card.label} className={cn(card.color, 'min-h-[154px] rounded-2xl p-5 transition hover:-translate-y-0.5')}>
          <div className="flex items-center justify-between gap-2"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#476057]">{card.label}</p><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/60 text-[#173A2E]"><CardIcon size={16}/></span></div>
          {card.isLoading
            ? <><Skeleton className="mt-5 h-[34px] w-24 bg-white/60"/><Skeleton className="mt-2 h-3 w-28 bg-white/60"/></>
            : <><p className="mt-5 text-[34px] font-black leading-none tracking-[-0.045em] text-[#173A2E]">{card.value}</p><p className="mt-2 text-xs font-bold text-[#587067]">{card.note}</p></>}
        </div>
      })}
    </section>

    <section className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 md:px-6">
          <div className="min-w-0"><h3 className="text-base font-black text-[#173A2E]">{page.listTitle}</h3>{page.listLoading ? <Skeleton className="mt-1.5 h-3 w-40 max-w-full"/> : <p className="mt-0.5 text-xs font-semibold text-[#8A9B94]">{page.listNote}</p>}</div>
          <div className="flex shrink-0 items-center gap-3">
            <DateRangeFilter value={page.listRange} onChange={page.setListRange} placeholder="Dates" triggerClassName="h-9 rounded-lg"/>
            <Link to={paths.bookings} className="hidden items-center gap-1 text-xs font-extrabold text-[#24764F] sm:flex">View all <ArrowRight size={14}/></Link>
          </div>
        </div>
        {page.listError
          ? <ErrorState title="We couldn’t load your bookings" onRetry={page.retryList} className="m-5"/>
          : page.listLoading
            ? <div className="px-5 md:px-6"><BookingRowsSkeleton/></div>
            : page.list.length === 0
              ? <EmptyState icon={<CalendarDays size={20}/>} title={page.listEmptyTitle} text={page.listEmptyText} action={<Button onClick={page.openNewBooking}><Plus size={17}/> New booking</Button>}/>
              : <div className="px-5 md:px-6">{page.list.map(booking => <BookingRow key={booking.id} booking={booking} onView={page.openBooking}/>)}</div>}
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <Link to={paths.bookings} className="flex w-full items-center gap-3 rounded-2xl bg-[#D8FF72] p-4 text-left transition hover:-translate-y-0.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/65 text-[#173A2E]"><CalendarCheck size={19}/></span>
          <span className="min-w-0 flex-1"><span className="block text-[10px] font-black uppercase tracking-wider text-[#597067]">Coming up next</span><span className="block text-sm font-black text-[#173A2E]">{page.tomorrowLabel}</span></span>
          <ArrowRight size={17} className="shrink-0 text-[#173A2E]"/>
        </Link>
        <MiniCalendar/>
        <div className="relative overflow-hidden rounded-2xl bg-[#173A2E] p-5 text-white">
          <div className="absolute -right-8 -top-9 h-28 w-28 rounded-full border-[22px] border-[#D8FF72]/10"/>
          <div className="relative flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#D8FF72] text-[#173A2E]"><TimerOff size={19}/></span>
            <div><p className="text-sm font-black">Need some breathing room?</p><p className="mt-1 text-xs font-semibold leading-relaxed text-white/55">Block personal time so clients can only book when you are truly available.</p><Link to={paths.availability} className="mt-3 inline-block text-xs font-black text-[#D8FF72]">Block time →</Link></div>
          </div>
        </div>
      </div>
    </section>
  </div>
}
