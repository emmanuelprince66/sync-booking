import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CUSTOMER_STATUS_FILTERS, CUSTOMERS_PAGE_SIZE, useCustomers, type Customer } from '@/api/customers'
import type { DateRange } from '@/components/ui/DateRangeFilter'
import { useDebounce } from '@/hooks/useDebounce'
import { useFormatMoney, useFormatMoneyCompact } from '@/hooks/useFormatMoney'
import { downloadCsv } from '@/lib/csv'
import { toIsoDate } from '@/lib/dates'
import { clientPath } from '@/routes/paths'
import { toClientRow } from '../utils'
import { useDeleteClient } from './useDeleteClient'

export type ClientDialog = { mode: 'add' } | { mode: 'edit'; client: Customer } | null

/** Clients: server-side search, status and date filters, pages, add, edit and delete (sink's customer list). */
export function useClientsPage() {
  const navigate = useNavigate()
  const money = useFormatMoney()
  const compact = useFormatMoneyCompact()
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState('')
  const [range, setRange] = useState<DateRange | undefined>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(CUSTOMERS_PAGE_SIZE)
  const [dialog, setDialog] = useState<ClientDialog>(null)
  const debounced = useDebounce(searchInput, 500)
  // Sink only sends a search from three characters.
  const search = debounced.trim().length >= 3 ? debounced.trim() : ''
  const query = useCustomers({ page, limit: pageSize, search, status, startDate: range?.from ? toIsoDate(range.from) : '', endDate: range?.from ? toIsoDate(range.to ?? range.from) : '' })
  const remove = useDeleteClient()

  const clients = query.data?.customers ?? []
  const summary = query.data?.summary

  return {
    searchInput,
    setSearch: (value: string) => { setSearchInput(value); setPage(1) },
    status,
    statusOptions: CUSTOMER_STATUS_FILTERS,
    setStatus: (value: string) => { setStatus(value); setPage(1) },
    range,
    setRange: (value: DateRange | undefined) => { setRange(value); setPage(1) },
    stats: summary
      ? [
        { label: 'Total clients', value: summary.customerCount.toLocaleString(), icon: 'user' as const, color: '#24764F' },
        { label: 'Active clients', value: summary.activeCustomers.toLocaleString(), icon: 'check' as const, color: '#3B6FB6' },
        { label: 'New clients', value: summary.newCustomers.toLocaleString(), icon: 'plus' as const, color: '#6655BD' },
        { label: 'Total spent', value: compact(summary.totalSpend), icon: 'wallet' as const, color: '#C77918' },
      ]
      : null,
    rows: clients.map(client => toClientRow(client, money)),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    retry: () => void query.refetch(),
    isEmpty: !query.isLoading && clients.length === 0,
    isFiltered: Boolean(search || status || range?.from),
    page,
    totalPages: query.data?.pages ?? 1,
    setPage,
    pageSize,
    setPageSize: (size: number) => { setPageSize(size); setPage(1) },
    dialog,
    openAdd: () => setDialog({ mode: 'add' }),
    openEdit: (client: Customer) => setDialog({ mode: 'edit', client }),
    closeDialog: () => setDialog(null),
    openDetail: (client: Customer) => navigate(clientPath(client.id)),
    remove,
    exportCsv: () => downloadCsv('clients.csv', ['Name', 'Code', 'Email', 'Phone', 'Bookings', 'Total spent', 'Last visit', 'Status'], clients.map(client => [client.name, client.customerCode, client.email, client.phone, client.bookingsCount, client.totalSpent, client.lastVisit, client.status])),
  }
}

export type ClientsPageModel = ReturnType<typeof useClientsPage>
