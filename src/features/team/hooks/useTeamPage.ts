import { useState } from 'react'
import { toast } from 'sonner'
import { ATTENDANT_ROLES, staffErrorMessage, useAttendants, useRemoveAttendant, type Attendant } from '@/api/attendants'
import { useBusinesses } from '@/api/business'
import { teamColor } from '@/features/bookings/utils'
import { initials } from '@/lib/format'
import { useTeamAccess } from './useTeamAccess'

const PAGE_SIZE = 10

export type TeamDialog = { mode: 'add' } | { mode: 'edit'; attendant: Attendant } | { mode: 'branches'; attendant: Attendant } | { mode: 'delete'; attendant: Attendant } | null

export type StaffRow = {
  attendant: Attendant
  initials: string
  color: string
  branches: string[]
  /** The owner's own account can't be edited or removed here. */
  isOwner: boolean
}

/**
 * Team: the business's staff accounts (sink-inventory's Staff page). list_attendants
 * returns everyone at once, so search, role filter and pages run here.
 */
export function useTeamPage() {
  const query = useAttendants()
  const businesses = useBusinesses()
  const remove = useRemoveAttendant()
  const access = useTeamAccess()
  const [search, setSearchValue] = useState('')
  const [role, setRoleValue] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeValue] = useState(PAGE_SIZE)
  const [dialog, setDialog] = useState<TeamDialog>(null)

  const branchName = (id: string, name: string) => name || businesses.data?.find(business => business.id === id)?.name || ''
  const all = query.data ?? []
  const term = search.trim().toLowerCase()
  const filtered = all.filter(attendant =>
    (!role || attendant.role === role)
    && (!term || [attendant.name, attendant.phone, attendant.roleLabel].some(value => value.toLowerCase().includes(term))))
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const rows: StaffRow[] = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(attendant => ({
    attendant,
    initials: initials(attendant.name || '?'),
    color: teamColor(all.indexOf(attendant)),
    branches: attendant.businesses.map(business => branchName(business.id, business.name)).filter(Boolean),
    isOwner: attendant.role === 'OWNER',
  }))

  const deleting = dialog?.mode === 'delete' ? dialog.attendant : null

  return {
    canInvite: access.canInvite,
    canManage: access.canManage,
    search,
    setSearch: (value: string) => { setSearchValue(value); setPage(1) },
    role,
    roleOptions: [{ value: '', label: 'All roles' }, { value: 'OWNER', label: 'Owner' }, ...ATTENDANT_ROLES],
    setRole: (value: string) => { setRoleValue(value); setPage(1) },
    rows,
    total: all.length,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    retry: () => void query.refetch(),
    isFiltered: Boolean(term || role),
    page: currentPage,
    totalPages,
    setPage,
    pageSize,
    setPageSize: (size: number) => { setPageSizeValue(size); setPage(1) },
    showPagination: !query.isLoading && filtered.length > 0,
    dialog,
    openAdd: () => setDialog({ mode: 'add' }),
    openEdit: (attendant: Attendant) => setDialog({ mode: 'edit', attendant }),
    openBranches: (attendant: Attendant) => setDialog({ mode: 'branches', attendant }),
    askDelete: (attendant: Attendant) => setDialog({ mode: 'delete', attendant }),
    closeDialog: () => setDialog(null),
    deleting,
    isDeleting: remove.isPending,
    confirmDelete: async () => {
      if (!deleting) return
      try {
        await remove.mutateAsync(deleting.id)
        toast.success(`${deleting.name} removed from your team`)
        setDialog(null)
      } catch (error) {
        toast.error(staffErrorMessage(error, 'Could not delete this staff member.'))
      }
    },
  }
}

export type TeamPageModel = ReturnType<typeof useTeamPage>
