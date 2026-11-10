import { CalendarClock, CheckCircle2, CreditCard, Mail, Phone, Plus, RotateCcw, UserRoundCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { BackLink, EmptyState, ErrorState, InitialsTile, SampleDataBadge } from '@/components/ui/misc'
import { Drawer, ModalTitle } from '@/components/ui/Modal'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useBookingDetails } from '../hooks/useBookingDetails'
import { CancelBookingModal, CheckoutModal, ReassignModal, RefundModal, RescheduleModal } from './BookingActionModals'
import { StatusBadge } from './BookingRow'

const cardLabel = 'text-[10px] font-black uppercase tracking-wider text-[#8A9C93]'

function DetailsSkeleton() {
  return <SkeletonGroup label="Loading booking" className="flex flex-col gap-4 p-5">
    <Skeleton className="h-28 rounded-2xl"/>
    <Skeleton className="h-32 rounded-2xl"/>
    <div className="grid grid-cols-2 gap-3"><Skeleton className="h-24 rounded-2xl"/><Skeleton className="h-24 rounded-2xl"/></div>
    <Skeleton className="h-36 rounded-2xl"/>
  </SkeletonGroup>
}

/** The design's right-hand booking drawer, with sink's full lifecycle on it. */
export function BookingDetailsDrawer() {
  const details = useBookingDetails()
  const { booking, view } = details
  return <Drawer open={details.open} onClose={details.close} title={booking ? undefined : 'Booking details'}>
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-white/95 px-6 py-5 backdrop-blur">
      <div className="min-w-0">
        <BackLink label="Back" onClick={details.close} className="mb-1.5 sm:hidden"/>
        <p className="truncate font-mono text-[10px] font-bold text-[#83978D]">{booking ? `BOOKING #${booking.reference}` : 'BOOKING'}</p>
        {booking ? <ModalTitle className="truncate text-xl font-black text-[#173A2E]">{booking.customerName}</ModalTitle> : <Skeleton className="mt-1 h-6 w-40"/>}
      </div>
      <button type="button" aria-label="Close" onClick={details.close} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F0F4F1]"><X size={18}/></button>
    </div>

    {details.isLoading && <DetailsSkeleton/>}
    {details.isError && <ErrorState title="We couldn’t load this booking" onRetry={() => void details.retry()} className="m-5"/>}
    {!details.isLoading && !details.isError && !booking && <EmptyState title="Booking not found" text="It may have been removed or isn’t available to your account."/>}

    {booking && view && <div className="flex flex-col gap-4 p-5">
      <div className="rounded-2xl bg-[#173A2E] p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs font-bold text-white/50">{view.dateLabel}</p><p className="mt-1 text-2xl font-black">{booking.startTime}</p><p className="mt-1 text-xs font-bold text-[#D8FF72]">{view.duration}</p></div>
          <StatusBadge value={booking.status}/>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8A9C93]">Services booked</p>
        <div className="mt-4 flex items-center gap-3">
          <InitialsTile initials={view.serviceInitials} color={view.serviceColor} className="h-11 w-11 rounded-xl text-xs"/>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-[#29483B]">{booking.serviceName}</p><p className="text-xs font-bold text-[#84968E]">{view.duration}</p></div>
          <p className="text-sm font-black text-[#173A2E]">{view.price}</p>
        </div>
        {details.extra && <div className="mt-3 border-t border-border pt-3">
          <div className="flex items-center gap-3">
            <InitialsTile initials={details.extra.initials} color="bg-[#CDEEDC]" className="h-11 w-11 rounded-xl text-xs"/>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-[#29483B]">{details.extra.name}</p><p className="text-xs font-bold text-[#84968E]">{details.extra.durationLabel}</p></div>
            <p className="text-sm font-black text-[#173A2E]">{details.extra.price}</p>
          </div>
          <SampleDataBadge className="mt-2"/>
        </div>}
        {!details.extra && <button type="button" onClick={details.showExtra} className="mt-4 flex items-center gap-1.5 text-xs font-black text-[#24764F]"><Plus size={14}/> Add another service</button>}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-4">
          <p className={cardLabel}>Attendee</p>
          <div className="mt-3 flex items-center gap-2">
            <InitialsTile initials={view.staffInitials} color="bg-[#FFD0C7]" className="h-8 w-8 rounded-lg text-[10px]"/>
            <div className="min-w-0"><p className="truncate text-xs font-black text-[#29483B]">{view.staffName}</p><p className="text-[10px] font-bold text-[#8A9C93]">{view.staffNote}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <p className={cardLabel}>Payment</p>
          <p className={cn('mt-3 text-sm font-black', view.payment.tone === 'good' ? 'text-[#1C7B4D]' : 'text-[#B66D14]')}>{view.payment.title}</p>
          {view.payment.note && <p className="mt-1 text-[10px] font-bold text-[#8A9C93]">{view.payment.note}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5">
        <p className={cardLabel}>Client</p>
        <div className="mt-3 flex flex-col gap-2 text-xs font-bold text-[#466056]">
          <a href={booking.customerPhone ? `tel:${booking.customerPhone}` : undefined} className="flex min-w-0 items-center gap-2"><Phone size={14} className="shrink-0 text-[#82988E]"/><span className="truncate">{booking.customerPhone || '—'}</span></a>
          <a href={booking.customerEmail ? `mailto:${booking.customerEmail}` : undefined} className="flex min-w-0 items-center gap-2"><Mail size={14} className="shrink-0 text-[#82988E]"/><span className="truncate">{booking.customerEmail || '—'}</span></a>
        </div>
        <p className="mt-3 text-[10px] font-bold text-[#8A9C93]">{view.sourceLabel}</p>
        {booking.notes && <p className="mt-3 rounded-xl bg-[#F1F7EE] p-3 text-xs font-semibold leading-relaxed text-[#466056]">{booking.notes}</p>}
        {booking.cancellationReason && <p className="mt-3 rounded-xl bg-[#FFF3F1] p-3 text-xs font-semibold leading-relaxed text-[#9A3B2F]">Cancelled: {booking.cancellationReason}</p>}
      </div>

      <div className="rounded-2xl border border-border bg-white p-5">
        <h4 className="text-sm font-black text-[#173A2E]">Appointment actions</h4>
        <div className="mt-4 grid gap-2">
          {details.canStart && <Button onClick={() => void details.start()} loading={details.isUpdating} className="w-full"><UserRoundCheck size={17}/> Check in & start appointment</Button>}
          {details.inProgress && <div className="flex items-center gap-3 rounded-xl bg-[#E2F7E9] p-4 text-sm font-black text-[#176D43]"><CheckCircle2 size={18}/> Appointment in progress</div>}
          {details.canComplete && <Button onClick={() => void details.complete()} loading={details.isUpdating} className="w-full"><CheckCircle2 size={17}/> Mark completed</Button>}
          {details.canTakePayment && <Button variant="secondary" onClick={() => details.openDialog('checkout')} className="w-full hover:translate-y-0"><CreditCard size={16}/> {view.takePaymentLabel}</Button>}
          {details.canDisburse && <Button variant="secondary" onClick={() => details.openDialog('refund')} className="w-full hover:translate-y-0"><RotateCcw size={16}/> {view.refundLabel}</Button>}
          {details.canManageBooking && <>
            <button type="button" onClick={() => details.openDialog('reschedule')} className="inline-flex h-10 items-center justify-center gap-1.5 text-xs font-extrabold text-[#6F847A]"><CalendarClock size={14}/> Reschedule</button>
            <button type="button" onClick={() => details.openDialog('reassign')} className="h-10 text-xs font-extrabold text-[#6F847A]">Reassign attendee</button>
            <button type="button" onClick={() => details.openDialog('cancel')} className="h-10 text-xs font-extrabold text-[#C2483D]">Cancel booking</button>
          </>}
          {!details.canStart && !details.inProgress && !details.canTakePayment && !details.canDisburse && !details.canManageBooking && <p className="text-xs font-semibold text-[#8A9C93]">No further actions for this booking.</p>}
        </div>
      </div>

      {details.dialog === 'checkout' && <CheckoutModal booking={booking} onClose={details.closeDialog}/>}
      {details.dialog === 'reschedule' && <RescheduleModal booking={booking} onClose={details.closeDialog}/>}
      {details.dialog === 'cancel' && <CancelBookingModal booking={booking} onClose={details.closeDialog}/>}
      {details.dialog === 'refund' && <RefundModal booking={booking} onClose={details.closeDialog}/>}
      {details.dialog === 'reassign' && <ReassignModal booking={booking} onClose={details.closeDialog}/>}
    </div>}
  </Drawer>
}
