import { createColumnHelper } from '@tanstack/react-table'
import { ChevronRight, Eye, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import type { Customer } from '@/api/customers'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { DataTable } from '@/components/ui/DataTable'
import { InitialsTile } from '@/components/ui/misc'
import { cn } from '@/lib/cn'
import { clientPath } from '@/routes/paths'
import type { ClientRow } from '../utils'

/** Leave out onEdit / onDelete for a role that can only view clients. */
type RowActions = { onView: (client: Customer) => void; onEdit?: (client: Customer) => void; onDelete?: (client: Customer) => void }

function StatusPill({ row }: { row: ClientRow }) {
  if (!row.status) return <span className="text-xs font-semibold text-[#9AABA4]">—</span>
  return <span className={cn('inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-extrabold', row.statusClassName)}>{row.status}</span>
}

function ClientName({ row }: { row: ClientRow }) {
  return <Link to={clientPath(row.client.id)} className="flex min-w-0 items-center gap-3">
    <InitialsTile initials={row.initials} color={row.color} className="h-10 w-10 rounded-xl text-xs"/>
    <span className="min-w-0">
      <span className="block truncate text-sm font-black text-[#29483B] hover:underline">{row.client.name}</span>
      <span className="block truncate text-xs font-semibold text-[#8A9C93]">{row.client.customerCode || row.contact}</span>
    </span>
  </Link>
}

const menu = (row: ClientRow, actions: RowActions) => <ActionMenu label={`Actions for ${row.client.name}`} items={[
  { label: 'View client', icon: <Eye size={14}/>, onSelect: () => actions.onView(row.client) },
  ...(actions.onEdit ? [{ label: 'Edit client', icon: <Pencil size={14}/>, onSelect: () => actions.onEdit?.(row.client) }] : []),
  ...(actions.onDelete ? [{ label: 'Delete client', icon: <Trash2 size={14}/>, danger: true, onSelect: () => actions.onDelete?.(row.client) }] : []),
]}/>

const column = createColumnHelper<ClientRow>()

const columnsFor = (actions: RowActions) => [
  column.display({ id: 'client', header: 'Client', cell: info => <ClientName row={info.row.original}/>, meta: { headerClassName: 'px-5', cellClassName: 'max-w-[280px] px-5' } }),
  column.display({ id: 'phone', header: 'Phone', cell: info => <span className="text-sm font-semibold text-[#466056]">{info.row.original.client.phone || '—'}</span> }),
  column.display({ id: 'bookings', header: 'Bookings', cell: info => <span className="text-sm font-bold text-[#60796E]">{info.row.original.bookings}</span> }),
  column.display({ id: 'spent', header: 'Total spent', cell: info => <span className="text-sm font-black text-[#173A2E]">{info.row.original.spent}</span> }),
  column.display({ id: 'lastVisit', header: 'Last visit', cell: info => <span className="text-sm font-semibold text-[#60796E]">{info.row.original.lastVisit}</span> }),
  column.display({ id: 'status', header: 'Status', cell: info => <StatusPill row={info.row.original}/> }),
  column.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, cell: info => menu(info.row.original, actions), meta: { cellClassName: 'w-12 pr-5 text-right' } }),
]

function MobileCard({ row, actions }: { row: ClientRow; actions: RowActions }) {
  return <div className="flex items-center gap-3 p-4">
    <Link to={clientPath(row.client.id)} className="flex min-w-0 flex-1 items-center gap-3">
      <InitialsTile initials={row.initials} color={row.color} className="h-10 w-10 rounded-xl text-xs"/>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-[#29483B]">{row.client.name}</span>
        <span className="block truncate text-xs font-semibold text-[#8A9C93]">{row.bookings} · {row.spent}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-[#A3B2AB]"/>
    </Link>
    {menu(row, actions)}
  </div>
}

/** The client list: a table from tablet up, tappable cards on phones. */
export function ClientsTable({ rows, loading, emptyState, actions }: { rows: ClientRow[]; loading: boolean; emptyState: React.ReactNode; actions: RowActions }) {
  return <DataTable columns={columnsFor(actions)} data={rows} loading={loading} emptyState={emptyState} getRowId={row => row.client.id} minWidthClassName="min-w-[860px]" renderMobileCard={row => <MobileCard row={row} actions={actions}/>}/>
}
