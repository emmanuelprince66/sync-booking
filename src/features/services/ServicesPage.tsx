import { Clock3, Pencil, Plus, Power, Sparkles, Tags, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, InitialsTile, PageTitle } from '@/components/ui/misc'
import { ConfirmModal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { paths } from '@/routes/paths'
import { ServiceFormModal } from './components/ServiceFormModal'
import { useServicesPage } from './hooks/useServicesPage'

function ServicesSkeleton() {
  return <SkeletonGroup label="Loading services" className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
    {Array.from({ length: 4 }, (_, index) => <div key={index} className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5">
      <Skeleton className="h-12 w-12 shrink-0 rounded-2xl"/>
      <div className="flex flex-1 flex-col gap-2"><Skeleton className="h-4 w-40 max-w-full"/><Skeleton className="h-3 w-20"/><div className="mt-3 flex justify-between"><Skeleton className="h-5 w-20"/><Skeleton className="h-3 w-16"/></div></div>
    </div>)}
  </SkeletonGroup>
}

export default function ServicesPage() {
  const page = useServicesPage()
  return <div className="mx-auto max-w-[1192px] p-5 md:p-8">
    <PageTitle title="Services" subtitle="Define what you offer and how long it takes." actions={<>
      <Link to={paths.serviceCategories} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-extrabold text-[#3E584E] transition hover:border-[#9DB1A9] hover:text-[#173A2E]"><Tags size={16}/> Manage categories</Link>
      <Button onClick={page.openAdd}><Plus size={17}/> Add service</Button>
    </>}/>
    <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-[#D8FF72] p-5 md:p-6">
      {page.isLoading
        ? <div className="flex flex-1 flex-col gap-2"><Skeleton className="h-4 w-48 max-w-full bg-white/60"/><Skeleton className="h-3 w-64 max-w-full bg-white/60"/></div>
        : <div className="min-w-0"><p className="text-sm font-black text-[#173A2E]">{page.banner.title}</p><p className="mt-1 text-xs font-bold text-[#587067]">{page.banner.note}</p></div>}
      {page.banner.showPill && <span className="hidden shrink-0 rounded-full bg-white/60 px-3 py-1.5 text-xs font-black text-[#173A2E] sm:inline">Fully bookable</span>}
    </div>
    {page.isError && <ErrorState title="We couldn’t load your services" onRetry={page.retry}/>}
    {page.isLoading && <ServicesSkeleton/>}
    {page.isEmpty && !page.isError && <div className="rounded-2xl border border-border bg-white"><EmptyState icon={<Sparkles size={20}/>} title="No services yet" text="Add your first service so clients can book it." action={<Button onClick={page.openAdd}><Plus size={17}/> Add service</Button>}/></div>}
    {!page.isLoading && !page.isError && <div className={cn('grid grid-cols-[minmax(0,1fr)] gap-4 transition-opacity md:grid-cols-2', page.isFetching && 'opacity-60')}>
      {page.cards.map(card => <div key={card.service.id} role="button" tabIndex={0} aria-label={`Edit ${card.service.name}`} onClick={() => page.openEdit(card.service)} onKeyDown={event => page.onCardKeyDown(event, card.service)} className={cn('group cursor-pointer rounded-2xl border border-border bg-white p-5 outline-none transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(23,58,46,0.08)] focus-visible:border-[#329661] focus-visible:ring-4 focus-visible:ring-[#329661]/10', !card.service.isActive && 'opacity-70')}>
        <div className="flex items-start gap-4">
          <InitialsTile initials={card.initials} color={card.color} image={card.service.image} className="h-12 w-12 rounded-2xl text-xs"/>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-words text-base font-black text-[#173A2E]">{card.service.name}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#84968E]"><Clock3 size={13}/>{card.duration}{!card.service.isActive && ' · Inactive'}</p>
              </div>
              {/* The whole card opens edit; the menu inside it must not. */}
              <div onClick={event => event.stopPropagation()}>
                <ActionMenu label={`Actions for ${card.service.name}`} items={[
                  { label: 'Edit service', icon: <Pencil size={14}/>, onSelect: () => page.openEdit(card.service) },
                  { label: card.service.isActive ? 'Deactivate' : 'Activate', icon: <Power size={14}/>, onSelect: () => void page.toggleActive(card.service) },
                  { label: 'Delete service', icon: <Trash2 size={14}/>, danger: true, onSelect: () => page.openDelete(card.service) },
                ]}/>
              </div>
            </div>
            <div className="mt-5 flex items-end justify-between gap-3"><p className="text-lg font-black text-[#173A2E]">{card.price}</p><p className="whitespace-nowrap text-xs font-bold text-[#84968E]">{card.bookings}</p></div>
          </div>
        </div>
      </div>)}
    </div>}
    {!page.isLoading && !page.isError && page.totalPages > 1 && <Pagination currentPage={page.page} totalPages={page.totalPages} onPageChange={page.setPage} className="mt-4 rounded-2xl border border-border bg-white"/>}
    {page.dialog?.mode === 'add' && <ServiceFormModal service={null} onClose={page.closeDialog}/>}
    {page.dialog?.mode === 'edit' && <ServiceFormModal service={page.dialog.service} onClose={page.closeDialog}/>}
    {page.dialog?.mode === 'delete' && <ConfirmModal onClose={page.closeDialog} eyebrow="Service catalogue" title="Delete service" confirmLabel="Delete service" cancelLabel="Keep service" isConfirming={page.isDeleting} onConfirm={() => void (page.dialog?.mode === 'delete' && page.confirmDelete(page.dialog.service))}>
      Delete <strong className="font-black text-[#173A2E]">{page.dialog.service.name}</strong>? Clients won’t be able to book it any more.
    </ConfirmModal>}
  </div>
}
