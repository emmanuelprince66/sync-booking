import { createColumnHelper } from '@tanstack/react-table'
import { History } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { EmptyState, ErrorState } from '@/components/ui/misc'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { StatCardSkeleton } from '@/components/ui/Skeleton'
import { StatCard } from '@/components/ui/StatCard'
import { cn } from '@/lib/cn'
import { useServiceHistory, type HistoryRow } from '../hooks/useServiceHistory'

const column = createColumnHelper<HistoryRow>()
const columns = [
  column.accessor('dateLabel', { header: 'Date', cell: info => <span className="text-xs font-bold text-[#5F756B]">{info.getValue()}</span>, meta: { headerClassName: 'pl-5', cellClassName: 'pl-5' } }),
  column.accessor('serviceName', { header: 'Service', cell: info => <span className="text-sm font-black text-[#173A2E]">{info.getValue()}</span> }),
  column.accessor('count', { header: 'Bookings', cell: info => <span className="text-xs font-extrabold text-[#29483B]">{info.getValue()}</span> }),
  column.accessor('revenueLabel', { header: 'Total revenue', cell: info => <span className="text-sm font-black text-[#173A2E]">{info.getValue()}</span>, meta: { headerClassName: 'pr-5 text-right', cellClassName: 'pr-5 text-right' } }),
]

function HistoryCard({ row }: { row: HistoryRow }) {
  return <div className="flex items-center justify-between gap-3 px-4 py-3.5">
    <div className="min-w-0">
      <p className="truncate text-sm font-black text-[#173A2E]">{row.serviceName}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-[#8A9C93]">{row.dateLabel} · {row.count} {row.count === 1 ? 'booking' : 'bookings'}</p>
    </div>
    <p className="shrink-0 text-sm font-black text-[#173A2E]">{row.revenueLabel}</p>
  </div>
}

/** Services → Service history: what was booked per date and service, and by whom. */
export function ServiceHistory() {
  const history = useServiceHistory()
  return <div className="min-w-0">
    <div className="mb-4 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
      <DateRangeFilter value={history.range} onChange={history.setRange} align="start" placeholder="This month" className="flex w-full" triggerClassName="w-full"/>
      <Select aria-label="Filter by attendant" value={history.attendant} options={history.attendantOptions} onValueChange={history.setAttendant} disabled={history.attendantLocked} boxClassName="h-10 min-h-0"/>
      <Select aria-label="Filter by service" value={history.service} options={history.serviceOptions} onValueChange={history.setService} boxClassName="h-10 min-h-0"/>
    </div>

    {history.isError
      ? <ErrorState title="We couldn’t load your service history" onRetry={history.retry}/>
      : <>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {history.isLoading
            ? <><StatCardSkeleton/><StatCardSkeleton/></>
            : <>
              <StatCard label="Total services booked" value={history.stats.booked} change={history.stats.scope} icon="check" color="#24764F"/>
              <StatCard label="Revenue" value={history.stats.revenue} change={history.stats.scope} icon="wallet" color="#6C59C3"/>
            </>}
        </div>
        <p className="mb-5 mt-2 text-[11px] font-semibold leading-relaxed text-[#8A9C93]">{history.rule}</p>

        <div className={cn('rounded-2xl border border-border bg-white transition-opacity', history.isFetching && !history.isLoading && 'opacity-60')}>
          <DataTable
            columns={columns}
            data={history.rows}
            loading={history.isLoading}
            getRowId={row => row.key}
            minWidthClassName="min-w-[560px]"
            renderMobileCard={row => <HistoryCard row={row}/>}
            emptyState={<EmptyState icon={<History size={20}/>} title={history.isFiltered ? 'Nothing matches these filters' : 'No services booked in this period'} text={history.isFiltered ? 'Try another attendant or service, or widen the dates.' : 'Pick a wider date range to see earlier bookings.'} action={history.isFiltered ? <Button variant="outline" onClick={history.clearFilters}>Clear filters</Button> : undefined}/>}
          />
          {history.hasRows && <Pagination currentPage={history.page} totalPages={history.totalPages} onPageChange={history.setPage} pageSize={history.pageSize} onPageSizeChange={history.setPageSize}/>}
        </div>
      </>}
  </div>
}
