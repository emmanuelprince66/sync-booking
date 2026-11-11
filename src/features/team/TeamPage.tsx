import { UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/common'
import { EmptyState, ErrorState, PageTitle } from '@/components/ui/misc'
import { ConfirmModal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/cn'
import { AttendantBranchesModal } from './components/AttendantBranchesModal'
import { StaffFormModal } from './components/StaffFormModal'
import { StaffTable } from './components/StaffTable'
import { useTeamPage } from './hooks/useTeamPage'

/** /team: staff accounts, their roles, permissions and branches. Bookings and services are assigned to these people. */
export default function TeamPage() {
  const page = useTeamPage()
  const addButton = page.canInvite && <Button onClick={page.openAdd}><UserPlus size={16}/> Add staff member</Button>
  return <div className="mx-auto max-w-[1192px] p-5 md:p-8">
    <PageTitle title="Team" subtitle="The people who take appointments, and what each can do." actions={addButton}/>

    <div className="rounded-2xl border border-border bg-white">
      <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
        <SearchInput value={page.search} onChange={page.setSearch} placeholder="Search by name, phone or role" className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-border bg-[#F8FAF7] px-3 text-[#8BA096] focus-within:border-[#329661] md:flex-1" inputClassName="w-full min-w-0 bg-transparent text-sm font-semibold text-[#29483B] outline-none" iconSize={15}/>
        <Select aria-label="Filter by role" searchable={false} value={page.role} options={page.roleOptions} onValueChange={page.setRole} className="min-w-0 md:w-52" boxClassName="h-10 min-h-0"/>
      </div>
      {page.isError
        ? <ErrorState title="We couldn’t load your team" onRetry={page.retry} className="m-5"/>
        : <div className={cn('transition-opacity', page.isFetching && !page.isLoading && 'opacity-60')}>
          <StaffTable
            rows={page.rows}
            loading={page.isLoading}
            actions={{ onEdit: page.openEdit, onBranches: page.openBranches, onDelete: page.askDelete, canManage: page.canManage }}
            emptyState={<EmptyState icon={<Users size={20}/>} title={page.isFiltered ? 'No one matches this search' : 'No staff yet'} text={page.isFiltered ? 'Try another name or role.' : 'Add the people who take appointments, so bookings and services can be assigned to them.'} action={page.isFiltered ? undefined : addButton || undefined}/>}
          />
        </div>}
      {page.showPagination && !page.isError && <Pagination currentPage={page.page} totalPages={page.totalPages} onPageChange={page.setPage} pageSize={page.pageSize} onPageSizeChange={page.setPageSize}/>}
    </div>

    {page.dialog?.mode === 'add' && <StaffFormModal attendant={null} onClose={page.closeDialog}/>}
    {page.dialog?.mode === 'edit' && <StaffFormModal attendant={page.dialog.attendant} onClose={page.closeDialog}/>}
    {page.dialog?.mode === 'branches' && <AttendantBranchesModal attendant={page.dialog.attendant} onClose={page.closeDialog}/>}
    {page.deleting && <ConfirmModal onClose={page.closeDialog} eyebrow="Team" title="Delete staff member" confirmLabel="Delete" cancelLabel="Cancel" isConfirming={page.isDeleting} onConfirm={() => void page.confirmDelete()}>
      Are you sure you want to delete <strong className="font-black text-[#173A2E]">{page.deleting.name}</strong>? They’ll lose access to every branch, and can no longer be assigned bookings or services.
    </ConfirmModal>}
  </div>
}
