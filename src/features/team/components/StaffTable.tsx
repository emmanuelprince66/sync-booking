import { createColumnHelper } from '@tanstack/react-table'
import { Building2, Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { roleLabel, type Attendant } from '@/api/attendants'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { DataTable } from '@/components/ui/DataTable'
import { InitialsTile } from '@/components/ui/misc'
import { cn } from '@/lib/cn'
import type { StaffRow } from '../hooks/useTeamPage'

type RowActions = { onEdit: (attendant: Attendant) => void; onBranches: (attendant: Attendant) => void; onDelete: (attendant: Attendant) => void; canManage: boolean }

const ROLE_STYLES: Record<string, string> = {
  OWNER: 'bg-[#D8FF72] text-[#173A2E]',
  'ADMIN-ATTENDANT': 'bg-[#E8F0FB] text-[#2F5E9E]',
  MANAGER: 'bg-[#E8F0FB] text-[#2F5E9E]',
  ATTENDANT: 'bg-[#F1F5F2] text-[#5E7268]',
  'INVENTORY-MANAGER': 'bg-[#F2EEFC] text-[#6655BD]',
  'PRODUCTION-MANAGER': 'bg-[#FFF5DE] text-[#875B13]',
  ACCOUNTANT: 'bg-[#E2F7E9] text-[#157443]',
  PHARMACIST: 'bg-[#E6F6F7] text-[#227A80]',
}

function RolePill({ role }: { role: string }) {
  return <span className={cn('inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide', ROLE_STYLES[role] ?? 'bg-[#F1F5F2] text-[#5E7268]')}>{roleLabel(role)}</span>
}

function Branches({ names }: { names: string[] }) {
  if (names.length === 0) return <span className="text-xs font-semibold text-[#9AABA4]">—</span>
  return <span className="block max-w-[260px] truncate text-sm font-semibold text-[#466056]" title={names.join(', ')}>{names.join(', ')}</span>
}

const menu = (row: StaffRow, actions: RowActions) => {
  if (!actions.canManage || row.isOwner) return null
  return <ActionMenu label={`Actions for ${row.attendant.name}`} items={[
    { label: 'Edit staff member', icon: <Pencil size={14}/>, onSelect: () => actions.onEdit(row.attendant) },
    { label: 'Manage branches', icon: <Building2 size={14}/>, onSelect: () => actions.onBranches(row.attendant) },
    { label: 'Delete staff member', icon: <Trash2 size={14}/>, danger: true, onSelect: () => actions.onDelete(row.attendant) },
  ]}/>
}

function Person({ row }: { row: StaffRow }) {
  return <span className="flex min-w-0 items-center gap-3">
    <InitialsTile initials={row.initials} color={row.color} className="h-10 w-10 rounded-xl text-xs"/>
    <span className="min-w-0">
      <span className="block truncate text-sm font-black text-[#29483B]">{row.attendant.name}</span>
      {row.attendant.phone && <span className="block truncate text-xs font-semibold text-[#8A9C93]">{row.attendant.phone}</span>}
    </span>
  </span>
}

const column = createColumnHelper<StaffRow>()

const columnsFor = (actions: RowActions) => [
  column.display({ id: 'name', header: 'Staff name', cell: info => <Person row={info.row.original}/>, meta: { headerClassName: 'px-5', cellClassName: 'max-w-[280px] px-5' } }),
  column.display({ id: 'role', header: 'Role', cell: info => <RolePill role={info.row.original.attendant.role}/> }),
  column.display({ id: 'branches', header: 'Branches', cell: info => <Branches names={info.row.original.branches}/> }),
  column.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, cell: info => menu(info.row.original, actions), meta: { cellClassName: 'w-12 pr-5 text-right' } }),
]

function MobileCard({ row, actions }: { row: StaffRow; actions: RowActions }) {
  return <div className="flex items-start gap-3 p-4">
    <InitialsTile initials={row.initials} color={row.color} className="h-10 w-10 rounded-xl text-xs"/>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-black text-[#29483B]">{row.attendant.name}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2"><RolePill role={row.attendant.role}/></div>
      {row.branches.length > 0 && <p className="mt-1.5 truncate text-[11px] font-semibold text-[#8A9C93]">{row.branches.join(', ')}</p>}
    </div>
    {menu(row, actions)}
  </div>
}

/** Staff list: a table from tablet up, cards on phones. */
export function StaffTable({ rows, loading, emptyState, actions }: { rows: StaffRow[]; loading: boolean; emptyState: ReactNode; actions: RowActions }) {
  return <DataTable columns={columnsFor(actions)} data={rows} loading={loading} emptyState={emptyState} getRowId={row => row.attendant.id} minWidthClassName="min-w-[640px]" renderMobileCard={row => <MobileCard row={row} actions={actions}/>}/>
}
