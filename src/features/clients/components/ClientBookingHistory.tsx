import { CalendarClock, ChevronRight } from 'lucide-react'
import { EmptyState, ErrorState, PillTabs } from '@/components/ui/misc'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { StatusBadge } from '@/features/bookings/components/BookingRow'
import type { ClientDetailModel } from '../hooks/useClientDetail'

/** Every booking this client made in the window, newest first. A row opens the shared booking drawer. */
export function ClientBookingHistory({ history }: { history: ClientDetailModel['history'] }) {
  return <section className="min-w-0 rounded-2xl border border-border bg-white">
    <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-black text-[#173A2E]">Booking history <span className="text-[#8A9C93]">· {history.count}</span></h2>
        <p className="mt-0.5 text-[11px] font-semibold text-[#8A9C93]">{history.windowLabel}</p>
      </div>
      <PillTabs value={history.filter} onChange={history.setFilter} options={history.filters} className="self-start sm:self-auto"/>
    </div>
    {history.isError
      ? <ErrorState title="We couldn’t load their bookings" onRetry={history.retry} className="m-5"/>
      : history.isLoading
        ? <ListSkeleton rows={4} rowClassName="flex items-center gap-4 border-b border-border px-5 py-4 last:border-0"/>
        : history.rows.length === 0
          ? <EmptyState icon={<CalendarClock size={20}/>} title="No bookings here yet" text="Bookings this client makes will show up here."/>
          : <ul>{history.rows.map(row => <li key={row.booking.id} className="border-b border-border last:border-0">
            <button type="button" onClick={row.open} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 text-left transition hover:bg-[#FAFCFA] md:grid-cols-[120px_minmax(0,1fr)_auto_auto]">
              <span className="min-w-0">
                <span className="block text-sm font-black text-[#173A2E]">{row.date}</span>
                <span className="block font-mono text-[11px] text-[#8A9C93]">{row.time}</span>
              </span>
              <span className="col-span-2 row-start-2 min-w-0 md:col-span-1 md:row-start-auto">
                <span className="block truncate text-sm font-extrabold text-[#29483B]">{row.booking.serviceName}</span>
                <span className="block truncate text-[11px] font-semibold text-[#8A9C93]">with {row.staff}</span>
              </span>
              <span className="hidden md:block"><StatusBadge value={row.booking.status}/></span>
              <span className="flex items-center gap-2 text-right">
                <span><span className="block text-sm font-black text-[#173A2E]">{row.price}</span><span className={cn('block text-[10px] font-extrabold', row.paymentClassName)}>{row.paymentLabel}</span></span>
                <ChevronRight size={16} className="text-[#A3B2AB]"/>
              </span>
            </button>
          </li>)}</ul>}
  </section>
}
