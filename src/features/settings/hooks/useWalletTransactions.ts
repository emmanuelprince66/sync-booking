import { useState } from 'react'
import { TRANSACTIONS_PAGE_SIZE, useWalletTransactions, type TransactionType, type WalletTransaction } from '@/api/wallet'
import type { DateRange } from '@/components/ui/DateRangeFilter'
import { useDebounce } from '@/hooks/useDebounce'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { toIsoDate } from '@/lib/dates'

export type TypeFilter = 'ALL' | TransactionType

export const TYPE_FILTERS: readonly { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'CREDIT', label: 'Money in' },
  { value: 'DEBIT', label: 'Money out' },
]

/** "Nov 6, 2026 · 9:41 AM" (sink: moment "MMM D, YYYY h:mm A"). */
export const formatTrxDate = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

export const statusTone = (status: string) => (status === 'SUCCESS' || status === 'SUCCESSFUL' ? 'green' : status === 'PENDING' ? 'amber' : 'red')

/**
 * Wallet credits and debits (GET wallet/{bank_id}/), sink's filters: search
 * (sent once it is empty or at least 3 characters), type, date range, page and rows per page.
 */
export function useWalletTransactionsList(bankId: string | null) {
  const money = useFormatMoney()
  const [searchInput, setSearchInput] = useState('')
  const debounced = useDebounce(searchInput.trim(), 500)
  const [settledSearch, setSettledSearch] = useState('')
  const [type, setType] = useState<TypeFilter>('ALL')
  const [range, setRange] = useState<DateRange | undefined>()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(TRANSACTIONS_PAGE_SIZE)
  const [details, setDetails] = useState<WalletTransaction | null>(null)

  // Short terms keep the last search instead of firing a request per keystroke.
  const search = debounced.length === 0 || debounced.length >= 3 ? debounced : settledSearch
  if (search !== settledSearch) { setSettledSearch(search); setPage(1) }

  const query = useWalletTransactions(bankId, {
    page,
    limit,
    search,
    type: type === 'ALL' ? '' : type,
    startDate: range?.from ? toIsoDate(range.from) : '',
    endDate: range?.to ? toIsoDate(range.to) : range?.from ? toIsoDate(range.from) : '',
  })
  const filtered = Boolean(search || type !== 'ALL' || range?.from)

  return {
    rows: query.data?.transactions ?? [],
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    isError: query.isError,
    retry: () => void query.refetch(),
    filtered,
    money,
    searchInput,
    setSearch: setSearchInput,
    type,
    setType: (value: TypeFilter) => { setType(value); setPage(1) },
    range,
    setRange: (value: DateRange | undefined) => { setRange(value); setPage(1) },
    pagination: { page, pages: query.data?.pages ?? 1, setPage, pageSize: limit, setPageSize: (size: number) => { setLimit(size); setPage(1) } },
    details,
    openDetails: setDetails,
    closeDetails: () => setDetails(null),
  }
}

export type WalletTransactionsModel = ReturnType<typeof useWalletTransactionsList>
