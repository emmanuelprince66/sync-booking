import { Pencil, Plus, Search, Tags, Trash2 } from 'lucide-react'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { Button } from '@/components/ui/Button'
import { BackLink, EmptyState, ErrorState, InitialsTile, PageTitle } from '@/components/ui/misc'
import { ConfirmModal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { CategoryFormModal } from './components/CategoryFormModal'
import { useCategoriesPage } from './hooks/useCategoriesPage'

/** /services/categories: sink's Store Management page, for service categories. */
export default function CategoriesPage() {
  const page = useCategoriesPage()
  return <div className="mx-auto max-w-[1192px] p-5 md:p-8">
    <BackLink label="Back to services" onClick={page.goBack} className="mb-3"/>
    <PageTitle title="Service categories" subtitle="Group your services so clients can find them." actions={<Button onClick={page.openAdd}><Plus size={17}/> Add category</Button>}/>
    <div className="rounded-2xl border border-border bg-white">
      <div className="border-b border-border p-4">
        <div className="relative sm:w-72"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8BA096]"/><input aria-label="Search categories" value={page.search} onChange={event => page.setSearch(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-[#F8FAF7] pl-9 pr-3 text-sm font-semibold outline-none focus:border-[#329661]" placeholder="Search categories"/></div>
      </div>
      {page.isError
        ? <ErrorState title="We couldn’t load your categories" onRetry={page.retry} className="m-5"/>
        : page.isLoading
          ? <ListSkeleton rows={4} rowClassName="flex items-center gap-3 border-b border-border p-4 last:border-0"/>
          : page.isEmpty
            ? <EmptyState icon={<Tags size={20}/>} title={page.isSearching ? 'No categories match that search' : 'No categories yet'} text={page.isSearching ? 'Check the spelling, or add it as a new category.' : 'Add a category, then pick it when you create a service.'} action={<Button onClick={page.openAdd}><Plus size={17}/> Add category</Button>}/>
            : <div className={cn('transition-opacity', page.isFetching && 'opacity-60')}>
              {page.rows.map(row => <div key={row.category.id} className="flex items-center gap-3 border-b border-border p-4 last:border-0">
                <InitialsTile initials={row.initials} color={row.color} className="h-10 w-10 rounded-xl text-xs"/>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-[#29483B]">{row.category.name}</p><p className="truncate text-xs font-semibold text-[#8A9C93]">{row.services}</p></div>
                <ActionMenu label={`Actions for ${row.category.name}`} items={[
                  { label: 'Edit category', icon: <Pencil size={14}/>, onSelect: () => page.openEdit(row.category) },
                  { label: 'Delete category', icon: <Trash2 size={14}/>, danger: true, onSelect: () => page.openDelete(row.category) },
                ]}/>
              </div>)}
            </div>}
      {!page.isLoading && !page.isError && page.totalPages > 1 && <Pagination currentPage={page.page} totalPages={page.totalPages} onPageChange={page.setPage}/>}
    </div>
    {page.dialog?.mode === 'add' && <CategoryFormModal category={null} onClose={page.closeDialog}/>}
    {page.dialog?.mode === 'edit' && <CategoryFormModal category={page.dialog.category} onClose={page.closeDialog}/>}
    {page.dialog?.mode === 'delete' && <ConfirmModal onClose={page.closeDialog} eyebrow="Service categories" title="Delete category" confirmLabel="Delete category" cancelLabel="Keep category" isConfirming={page.isDeleting} onConfirm={() => void (page.dialog?.mode === 'delete' && page.confirmDelete(page.dialog.category))}>
      Delete <strong className="font-black text-[#173A2E]">{page.dialog.category.name}</strong>?{page.deleteNote(page.dialog.category)}
      {page.deleteError && <span role="alert" className="mt-3 block rounded-xl border border-[#F3D9D5] bg-[#FFF8F6] p-3 text-xs font-bold text-[#9A3B2F]">{page.deleteError}</span>}
    </ConfirmModal>}
  </div>
}
