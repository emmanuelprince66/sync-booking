import { CalendarDays, FileDown, Plus, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ColorStatCard } from '@/components/ui/ColorStatCard'
import { SearchInput } from '@/components/ui/common'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { EmptyState, ErrorState, PageTitle, PillTabs } from '@/components/ui/misc'
import { OptionSelect } from '@/components/ui/OptionSelect'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { useDismissRoot } from '@/hooks/useDismiss'
import { cn } from '@/lib/cn'
import { BookingRow, BookingRowsSkeleton } from './components/BookingRow'
import { REFUND_FILTERS } from './constants'
import { useBookingsPage, type BookingsPageModel } from './hooks/useBookingsPage'
import { PAYMENT_FILTER_OPTIONS } from './utils'

function StatCards({ page }: { page: BookingsPageModel }) {
  return <section aria-label="Booking totals" className="mb-5">
    <p className="mb-2 text-[11px] font-bold text-[#5F756B]">{page.statsNote}</p>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {page.stats.map(card => <ColorStatCard key={card.label} label={card.label} value={card.value} note={card.note} icon={card.icon} tone={card.tone} loading={page.statsLoading} active={card.active} onClick={card.onClick}/>)}
    </div>
  </section>
}

function FilterMenu({ page }: { page: BookingsPageModel }) {
  const { filter } = page
  const rootRef = useDismissRoot(filter.isOpen, filter.close)
  return <div ref={rootRef} className="shrink-0 sm:relative">
    <button type="button" aria-expanded={filter.isOpen} onClick={filter.toggle} className={cn('inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-extrabold', filter.payment ? 'border-[#329661] text-[#176D43]' : 'border-border text-[#536A60]')}><SlidersHorizontal size={14}/> Filter</button>
    {filter.isOpen && <div className="absolute left-0 top-11 z-20 flex w-[min(320px,calc(100vw-5.5rem))] flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-[0_14px_35px_rgba(23,58,46,0.14)] sm:left-auto sm:right-0">
      <div className="flex items-center justify-between"><p className="text-sm font-black text-[#173A2E]">Filter bookings</p><button type="button" aria-label="Close filters" onClick={filter.close} className="text-[#82988E]"><X size={16}/></button></div>
      <OptionSelect label="Payment" options={PAYMENT_FILTER_OPTIONS} value={filter.payment} onValueChange={filter.setPayment}/>
      <button type="button" onClick={filter.clear} className="self-start text-xs font-extrabold text-[#24764F]">Clear all filters</button>
    </div>}
  </div>
}

/** Bookings: the design's stat cards and a server-paged list, with sink's refund queue as its own tab. */
export default function BookingsPage() {
  const page = useBookingsPage()
  return <div className="mx-auto max-w-[1192px] p-5 md:p-8">
    <PageTitle title="Bookings" subtitle="Every appointment, neatly in place." actions={<>
      <Button variant="outline" onClick={() => void page.exportCsv()} loading={page.isExporting} className="text-foreground"><FileDown size={16}/> Export</Button>
      {page.canAddBooking && <Button onClick={page.openNewBooking}><Plus size={17}/> New booking</Button>}
    </>}/>
    <StatCards page={page}/>
    <div className="rounded-2xl border border-border bg-white">
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PillTabs value={page.tab} onChange={page.setTab} options={page.tabs} className="min-w-0 self-start"/>
          {!page.isRefunds && <div className="relative flex shrink-0 items-center gap-2">
            <DateRangeFilter value={page.filter.dates} onChange={page.filter.setDates} placeholder="Date range" triggerClassName="h-9 rounded-lg"/>
            <FilterMenu page={page}/>
          </div>}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput value={page.filter.search} onChange={page.filter.setSearch} placeholder="Search by client name, phone or reference" iconSize={15} className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-border bg-[#F8FAF7] px-3 text-[#8BA096] focus-within:border-[#329661] sm:flex-1" inputClassName="w-full min-w-0 bg-transparent text-sm font-semibold text-[#405B50] outline-none placeholder:text-[#9DAEA6]"/>
          {!page.isRefunds && <Select aria-label="Filter by status" searchable={false} value={page.status} options={page.statusOptions} onValueChange={page.setStatus} className="min-w-0 sm:w-48" boxClassName="h-10 min-h-0"/>}
        </div>
      </div>
      {page.isRefunds && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 md:px-6">
        <PillTabs value={page.refundFilter} onChange={page.setRefundFilter} options={REFUND_FILTERS}/>
        {page.pendingRefundsLabel && <p className="text-xs font-extrabold text-[#B2402F]">{page.pendingRefundsLabel}</p>}
      </div>}
      {page.isError
        ? <ErrorState title="We couldn’t load your bookings" onRetry={page.retry} className="m-5"/>
        : page.isLoading
          ? <div className="px-5 md:px-6"><BookingRowsSkeleton rows={Math.min(page.pageSize, 6)}/></div>
          : page.isEmpty
            ? <EmptyState icon={<CalendarDays size={20}/>} title={page.isFiltered ? 'No bookings match this view' : page.isRefunds ? 'No refunds here' : 'No bookings yet'} text={page.isFiltered ? 'Try another search or status, or widen the date range.' : page.isRefunds ? 'Refunds from cancelled bookings will queue up here.' : 'Add your first booking or share your booking page.'} action={!page.isRefunds && !page.isFiltered && page.canAddBooking ? <Button onClick={page.openNewBooking}><Plus size={17}/> New booking</Button> : undefined}/>
            : <div aria-busy={page.isFetching} className={cn('px-5 transition-opacity md:px-6', page.isFetching && 'opacity-60')}>{page.rows.map(booking => <BookingRow key={booking.id} booking={booking} onView={page.openBooking}/>)}</div>}
      {!page.isError && !page.isEmpty && <Pagination currentPage={page.page} totalPages={page.totalPages} onPageChange={page.setPage} pageSize={page.pageSize} onPageSizeChange={page.setPageSize} pageSizeOptions={page.pageSizeOptions}/>}
    </div>
  </div>
}
