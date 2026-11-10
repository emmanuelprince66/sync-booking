import { CalendarDays, FileDown, Plus, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/common'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { EmptyState, ErrorState, PageTitle, PillTabs } from '@/components/ui/misc'
import { OptionSelect } from '@/components/ui/OptionSelect'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDismissRoot } from '@/hooks/useDismiss'
import { cn } from '@/lib/cn'
import { BookingRow, BookingRowsSkeleton } from './components/BookingRow'
import { BOOKING_TABS, REFUND_FILTERS } from './constants'
import { useBookingsPage, type BookingsPageModel } from './hooks/useBookingsPage'
import { PAYMENT_FILTER_OPTIONS } from './utils'

function StatCards({ page }: { page: BookingsPageModel }) {
  return <div className="mb-5 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {page.stats.map(card => {
      const StatIcon = card.icon
      return <button key={card.label} type="button" onClick={card.onClick} className={cn(card.color, 'rounded-2xl p-4 text-left transition hover:-translate-y-0.5')}>
        <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#587067]">{card.label}</span><StatIcon size={16} className="text-[#173A2E]"/></div>
        {page.statsLoading ? <Skeleton className="mt-3 h-8 w-16 bg-white/60"/> : <p className="mt-3 text-2xl font-black text-[#173A2E]">{card.value}</p>}
        <p className="mt-1 truncate text-[11px] font-bold text-[#668076]">{page.statsLoading ? ' ' : card.note}</p>
      </button>
    })}
  </div>
}

function FilterMenu({ page }: { page: BookingsPageModel }) {
  const { filter } = page
  const rootRef = useDismissRoot(filter.isOpen, filter.close)
  return <div ref={rootRef} className="shrink-0 sm:relative">
    <button type="button" aria-expanded={filter.isOpen} onClick={filter.toggle} className={cn('inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-extrabold', filter.isActive ? 'border-[#329661] text-[#176D43]' : 'border-border text-[#536A60]')}><SlidersHorizontal size={14}/> Filter</button>
    {filter.isOpen && <div className="absolute left-0 top-11 z-20 flex w-[min(320px,calc(100vw-5.5rem))] flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-[0_14px_35px_rgba(23,58,46,0.14)] sm:left-auto sm:right-0">
      <div className="flex items-center justify-between"><p className="text-sm font-black text-[#173A2E]">Filter bookings</p><button type="button" aria-label="Close filters" onClick={filter.close} className="text-[#82988E]"><X size={16}/></button></div>
      <SearchInput value={filter.search} onChange={filter.setSearch} placeholder="Client, service or reference" iconSize={15} className="flex h-10 items-center gap-2 rounded-xl border border-border bg-[#F8FAF7] px-3 text-[#8BA096]" inputClassName="w-full min-w-0 bg-transparent text-sm font-semibold text-[#405B50] outline-none placeholder:text-[#9DAEA6]"/>
      {!page.isRefunds && <OptionSelect label="Payment" options={PAYMENT_FILTER_OPTIONS} value={filter.payment} onValueChange={filter.setPayment}/>}
      <button type="button" onClick={filter.clear} className="self-start text-xs font-extrabold text-[#24764F]">Clear filters</button>
    </div>}
  </div>
}

/** Bookings: the design's stat cards and list, with sink's refund queue as a sixth tab. */
export default function BookingsPage() {
  const page = useBookingsPage()
  return <div className="mx-auto max-w-[1192px] p-5 md:p-8">
    <PageTitle title="Bookings" subtitle="Every appointment, neatly in place." actions={<>
      <Button variant="outline" onClick={page.exportCsv} className="text-foreground"><FileDown size={16}/> Export</Button>
      <Button onClick={page.openNewBooking}><Plus size={17}/> New booking</Button>
    </>}/>
    <StatCards page={page}/>
    <div className="rounded-2xl border border-border bg-white">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <PillTabs value={page.tab} onChange={page.setTab} options={BOOKING_TABS} className="min-w-0"/>
        <div className="relative flex shrink-0 items-center gap-2">
          {!page.isRefunds && <DateRangeFilter value={page.filter.dates} onChange={page.filter.setDates} placeholder="Date range" triggerClassName="h-9 rounded-lg"/>}
          <FilterMenu page={page}/>
        </div>
      </div>
      {page.isRefunds && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 md:px-6">
        <PillTabs value={page.refundFilter} onChange={page.setRefundFilter} options={REFUND_FILTERS}/>
        {page.pendingRefundsLabel && <p className="text-xs font-extrabold text-[#B2402F]">{page.pendingRefundsLabel}</p>}
      </div>}
      {page.isError
        ? <ErrorState title="We couldn’t load your bookings" onRetry={page.retry} className="m-5"/>
        : page.isLoading
          ? <div className="px-5 md:px-6"><BookingRowsSkeleton rows={5}/></div>
          : page.isEmpty
            ? <EmptyState icon={<CalendarDays size={20}/>} title={page.isFiltered ? 'No bookings match this view' : page.isRefunds ? 'No refunds here' : 'No bookings yet'} text={page.isFiltered ? 'Try another tab, or widen the date range.' : page.isRefunds ? 'Refunds from cancelled bookings will queue up here.' : 'Add your first booking or share your booking page.'} action={!page.isRefunds && !page.isFiltered ? <Button onClick={page.openNewBooking}><Plus size={17}/> New booking</Button> : undefined}/>
            : <div className={cn('px-5 transition-opacity md:px-6', page.isFetching && 'opacity-60')}>{page.rows.map(booking => <BookingRow key={booking.id} booking={booking} onView={page.openBooking}/>)}</div>}
      {!page.isLoading && !page.isError && page.totalPages > 1 && <Pagination currentPage={page.page} totalPages={page.totalPages} onPageChange={page.setPage}/>}
    </div>
  </div>
}
