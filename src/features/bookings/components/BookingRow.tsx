import { MoreHorizontal } from 'lucide-react'
import type { Booking, BookingStatus } from '@/api/bookings'
import { InitialsTile } from '@/components/ui/misc'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useBookingRow } from '../hooks/useBookingRow'
import { STATUS_LABELS, STATUS_STYLES } from '../utils'

/** The design's status pill. */
export function StatusBadge({ value }: { value: BookingStatus }) {
  return <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold', STATUS_STYLES[value] ?? STATUS_STYLES.NO_SHOW)}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{STATUS_LABELS[value] ?? value}</span>
}

export function BookingRow({ booking, compact = false, onView }: { booking: Booking; compact?: boolean; onView: (id: string) => void }) {
  const row = useBookingRow(booking)
  return <div className={cn('group grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-3.5 last:border-0 md:grid-cols-[62px_minmax(0,1.2fr)_minmax(0,1fr)_auto]', !compact && 'lg:grid-cols-[62px_minmax(0,1.2fr)_minmax(0,1fr)_108px_minmax(120px,auto)]')}>
    <div className="min-w-0">
      <p className="font-mono text-sm font-bold text-[#173A2E]">{row.time}</p>
      <p className="font-mono text-[10px] text-[#93A39C]">{row.secondary}</p>
    </div>
    <div className="flex min-w-0 items-center gap-3">
      <InitialsTile initials={row.initials} color={row.color} className="h-9 w-9 rounded-xl text-[11px]"/>
      <div className="min-w-0"><p className="truncate text-sm font-extrabold text-[#203B31]">{booking.customerName}</p><p className="truncate text-xs font-semibold text-[#84968E] md:hidden">{booking.serviceName}</p></div>
    </div>
    <div className="hidden min-w-0 md:block"><p className="truncate text-sm font-bold text-[#466056]">{booking.serviceName}</p><p className="truncate text-[11px] font-semibold text-[#9AABA4]">{row.businessName}</p></div>
    {!compact && <div className="hidden lg:block"><StatusBadge value={booking.status}/></div>}
    <div className="flex items-center justify-end gap-3">
      <div className="hidden text-right sm:block"><span className="text-sm font-black text-[#173A2E]">{row.price}</span><p className={cn('text-[10px] font-extrabold', row.paymentClassName)}>{row.paymentLabel}</p></div>
      <button type="button" aria-label={`View ${booking.customerName}’s booking`} onClick={() => onView(booking.id)} className="grid h-8 w-8 place-items-center rounded-lg text-[#91A199] hover:bg-[#EDF3EF]"><MoreHorizontal size={17}/></button>
    </div>
  </div>
}

/** Same shape as a list of BookingRows. */
export function BookingRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return <SkeletonGroup label="Loading bookings">{Array.from({ length: rows }, (_, index) => <div key={index} className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-3.5 last:border-0">
    <div className="flex flex-col gap-1.5"><Skeleton className="h-3.5 w-10"/><Skeleton className="h-2.5 w-12"/></div>
    <div className="flex min-w-0 items-center gap-3"><Skeleton className="h-9 w-9 shrink-0 rounded-xl"/><div className="flex min-w-0 flex-1 flex-col gap-1.5"><Skeleton className="h-3 w-32 max-w-full"/><Skeleton className="h-2.5 w-24 max-w-full"/></div></div>
    <Skeleton className="h-8 w-8 rounded-lg"/>
  </div>)}</SkeletonGroup>
}
