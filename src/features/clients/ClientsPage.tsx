import { FileDown, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/common'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { EmptyState, ErrorState, PageTitle } from '@/components/ui/misc'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { StatCardsSkeleton } from '@/components/ui/Skeleton'
import { StatCard } from '@/components/ui/StatCard'
import { cn } from '@/lib/cn'
import { ClientFormModal } from './components/ClientFormModal'
import { ClientsTable } from './components/ClientsTable'
import { DeleteClientModal } from './components/DeleteClientModal'
import { useClientsPage } from './hooks/useClientsPage'

const STATS_GRID = 'mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4'

export default function ClientsPage() {
  const page = useClientsPage()
  return <div className="mx-auto max-w-[1192px] p-5 md:p-8">
    <PageTitle title="Clients" subtitle="The people who keep coming back." actions={<>
      {page.can.export && <Button variant="outline" onClick={page.exportCsv} disabled={page.isEmpty}><FileDown size={16}/> Export</Button>}
      {page.can.add && <Button onClick={page.openAdd}><Plus size={17}/> Add client</Button>}
    </>}/>

    {page.stats
      ? <div className={STATS_GRID}>{page.stats.map(stat => <StatCard key={stat.label} {...stat}/>)}</div>
      : !page.isError && <StatCardsSkeleton count={4} className={STATS_GRID}/>}

    <div className="rounded-2xl border border-border bg-white">
      <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
        <SearchInput value={page.searchInput} onChange={page.setSearch} placeholder="Search by name, phone or email" className="flex h-10 min-w-0 shrink-0 items-center gap-2 rounded-xl border border-border bg-[#F8FAF7] md:flex-1 px-3 text-[#8BA096] focus-within:border-[#329661]" inputClassName="w-full min-w-0 bg-transparent text-sm font-semibold text-[#29483B] outline-none" iconSize={15}/>
        <div className="grid grid-cols-2 gap-3 md:flex">
          <Select aria-label="Filter by status" searchable={false} value={page.status} options={page.statusOptions} onValueChange={page.setStatus} className="min-w-0 md:w-44" boxClassName="h-10 min-h-0"/>
          <DateRangeFilter value={page.range} onChange={page.setRange} placeholder="Date added" className="min-w-0 md:w-52"/>
        </div>
      </div>
      {page.isError
        ? <ErrorState title="We couldn’t load your clients" onRetry={page.retry} className="m-5"/>
        : <div className={cn('transition-opacity', page.isFetching && !page.isLoading && 'opacity-60')}>
          <ClientsTable
            rows={page.rows}
            loading={page.isLoading}
            actions={{ onView: page.openDetail, onEdit: page.can.edit ? page.openEdit : undefined, onDelete: page.can.delete ? page.remove.ask : undefined }}
            emptyState={<EmptyState icon={<Users size={20}/>} title={page.isFiltered ? 'No clients match these filters' : 'No clients yet'} text={page.isFiltered ? 'Try another search or clear the filters.' : 'Clients are added here as they book. You can also add one yourself.'} action={page.isFiltered || !page.can.add ? undefined : <Button onClick={page.openAdd}><Plus size={17}/> Add client</Button>}/>}
          />
        </div>}
      {!page.isLoading && !page.isError && !page.isEmpty && <Pagination currentPage={page.page} totalPages={page.totalPages} onPageChange={page.setPage} pageSize={page.pageSize} onPageSizeChange={page.setPageSize}/>}
    </div>

    {page.dialog?.mode === 'add' && <ClientFormModal client={null} onClose={page.closeDialog}/>}
    {page.dialog?.mode === 'edit' && <ClientFormModal client={page.dialog.client} onClose={page.closeDialog}/>}
    <DeleteClientModal flow={page.remove}/>
  </div>
}
