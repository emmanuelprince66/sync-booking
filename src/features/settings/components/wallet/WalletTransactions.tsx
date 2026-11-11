import { createColumnHelper } from '@tanstack/react-table'
import { ArrowDownLeft, ArrowUpRight, ChevronRight, ReceiptText } from 'lucide-react'
import type { WalletTransaction } from '@/api/wallet'
import { SearchInput } from '@/components/ui/common'
import { DataTable } from '@/components/ui/DataTable'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { EmptyState, ErrorState, PillTabs } from '@/components/ui/misc'
import { Modal, ModalHeader } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { cn } from '@/lib/cn'
import { TYPE_FILTERS, formatTrxDate, statusTone, useWalletTransactionsList, type WalletTransactionsModel } from '../../hooks/useWalletTransactions'

const pill = (tone: 'green' | 'red' | 'amber' | 'grey') => cn('inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold', {
  green: 'bg-[#E2F7E9] text-[#157443]', red: 'bg-[#FDECEA] text-[#B23F35]', amber: 'bg-[#FFF1CB] text-[#946000]', grey: 'bg-[#EEF3F0] text-[#53665D]',
}[tone])

const titleOf = (trx: WalletTransaction) => trx.accountName || trx.description || (trx.type === 'CREDIT' ? 'Wallet credit' : 'Wallet debit')

function TypeIcon({ credit, className }: { credit: boolean; className?: string }) {
  return <span className={cn('grid shrink-0 place-items-center rounded-xl', credit ? 'bg-[#E2F7E9] text-[#157443]' : 'bg-[#FDECEA] text-[#B23F35]', className)}>{credit ? <ArrowDownLeft size={16}/> : <ArrowUpRight size={16}/>}</span>
}

const column = createColumnHelper<WalletTransaction>()

const buildColumns = (model: WalletTransactionsModel) => [
  column.display({ id: 'details', header: 'Details', meta: { headerClassName: 'px-5', cellClassName: 'px-5' }, cell: ({ row: { original } }) => <div className="flex min-w-0 items-center gap-3">
    <TypeIcon credit={original.type === 'CREDIT'} className="h-9 w-9"/>
    <div className="min-w-0 max-w-[260px]"><p className="truncate text-xs font-extrabold text-[#173A2E]">{titleOf(original)}</p><p className="truncate text-[11px] font-semibold text-[#8A9C93]">{original.description || original.bankName || '—'}</p></div>
  </div> }),
  column.accessor('amount', { header: 'Amount', cell: ({ row: { original } }) => <span className={cn('text-xs font-black', original.type === 'CREDIT' ? 'text-[#157443]' : 'text-[#B23F35]')}>{original.type === 'CREDIT' ? '+' : '−'}{model.money(original.amount)}</span> }),
  column.accessor('channel', { header: 'Channel', cell: ({ getValue }) => <span className={pill('grey')}>{getValue() || '—'}</span> }),
  column.accessor('createdAt', { header: 'Date', cell: ({ getValue }) => <span className="text-xs font-semibold text-[#7A8F85]">{formatTrxDate(getValue())}</span> }),
  column.accessor('status', { header: 'Status', cell: ({ getValue }) => <span className={pill(statusTone(getValue()))}>{getValue()}</span> }),
  column.display({ id: 'view', header: () => <span className="sr-only">View</span>, meta: { cellClassName: 'pr-5 text-right' }, cell: ({ row: { original } }) => <button type="button" onClick={() => model.openDetails(original)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold text-[#24764F] hover:bg-[#EDF4EF]">View <ChevronRight size={14}/></button> }),
]

function TransactionCard({ trx, model }: { trx: WalletTransaction; model: WalletTransactionsModel }) {
  const credit = trx.type === 'CREDIT'
  return <button type="button" onClick={() => model.openDetails(trx)} className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-[#FAFCFA]">
    <TypeIcon credit={credit} className="h-9 w-9"/>
    <span className="min-w-0 flex-1">
      <span className="flex items-center justify-between gap-3"><span className="truncate text-xs font-extrabold text-[#173A2E]">{titleOf(trx)}</span><span className={cn('shrink-0 text-xs font-black', credit ? 'text-[#157443]' : 'text-[#B23F35]')}>{credit ? '+' : '−'}{model.money(trx.amount)}</span></span>
      <span className="mt-1.5 flex items-center justify-between gap-3"><span className="truncate text-[11px] font-semibold text-[#8A9C93]">{formatTrxDate(trx.createdAt)}</span><span className={pill(statusTone(trx.status))}>{trx.status}</span></span>
    </span>
  </button>
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-[#EDF1EF] py-3 text-xs last:border-0"><span className="shrink-0 font-semibold text-[#7D8D85]">{label}</span><span className="min-w-0 break-all text-right font-extrabold text-[#29483B]">{value || '—'}</span></div>
}

function TransactionDetailsModal({ model }: { model: WalletTransactionsModel }) {
  const trx = model.details
  const credit = trx?.type === 'CREDIT'
  return <Modal open={Boolean(trx)} onClose={model.closeDetails} panelClassName="flex max-h-[calc(100dvh-2rem)] w-full max-w-[460px] flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl">
    <ModalHeader eyebrow="Wallet" title="Transaction details" onClose={model.closeDetails} className="shrink-0"/>
    {trx && <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className={cn('rounded-2xl p-5 text-center', credit ? 'bg-[#EEF8F1]' : 'bg-[#FDF1EF]')}>
        <TypeIcon credit={credit} className="mx-auto h-11 w-11 rounded-full"/>
        <p className={cn('mt-3 text-[11px] font-extrabold uppercase tracking-wide', credit ? 'text-[#157443]' : 'text-[#B23F35]')}>{credit ? 'Money in' : 'Money out'}</p>
        <p className="mt-1 break-words text-2xl font-black text-[#173A2E]">{credit ? '+' : '−'}{model.money(trx.amount)}</p>
        <span className={cn(pill(statusTone(trx.status)), 'mt-3')}>{trx.status}</span>
      </div>
      <div className="mt-4">
        <DetailRow label="Reference" value={trx.reference}/>
        <DetailRow label="Date" value={formatTrxDate(trx.createdAt)}/>
        <DetailRow label={credit ? 'From' : 'To'} value={trx.accountName}/>
        <DetailRow label="Account number" value={trx.accountNumber}/>
        <DetailRow label="Bank" value={trx.bankName}/>
        <DetailRow label="Channel" value={trx.channel}/>
        {trx.charges > 0 && <DetailRow label="Fee" value={model.money(trx.charges)}/>}
        {trx.description && <DetailRow label="Description" value={trx.description}/>}
      </div>
    </div>}
  </Modal>
}

/** Wallet transactions: search, money in/out, date range, table (cards on phones) and pages — SyncShip's Transactions section. */
export function WalletTransactions({ bankId }: { bankId: string | null }) {
  const model = useWalletTransactionsList(bankId)
  const { pagination } = model
  return <section className="overflow-hidden rounded-2xl border border-border bg-white">
    <div className="flex items-center gap-3 border-b border-[#EBF0ED] px-5 py-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EDF4EF] text-[#24764F]"><ReceiptText size={17}/></span>
      <div className="min-w-0"><h3 className="text-sm font-black text-[#173A2E]">Transactions</h3><p className="text-[11px] font-semibold text-[#8A9C93]">Money in and out of your wallet</p></div>
      {model.isRefreshing && <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-[#329661] border-t-transparent" role="status" aria-label="Updating"/>}
    </div>
    <div className="flex flex-col gap-3 border-b border-[#EBF0ED] p-4 lg:flex-row lg:items-center lg:justify-between">
      <SearchInput value={model.searchInput} onChange={model.setSearch} placeholder="Search transactions" className="flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-[#FBFCFA] px-3 text-[#7B8B83] lg:w-64" inputClassName="w-full min-w-0 bg-transparent text-xs font-semibold text-[#29483B] outline-none"/>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <PillTabs value={model.type} onChange={model.setType} options={TYPE_FILTERS}/>
        <DateRangeFilter value={model.range} onChange={model.setRange} placeholder="Date range" className="flex" triggerClassName="h-10 w-full rounded-xl sm:w-auto"/>
      </div>
    </div>
    {model.isError
      ? <ErrorState title="We couldn’t load your transactions" onRetry={model.retry} className="m-4"/>
      : <DataTable columns={buildColumns(model)} data={model.rows} loading={model.isLoading} minWidthClassName="min-w-[760px]" getRowId={trx => trx.id}
        emptyState={<EmptyState icon={<ReceiptText size={20}/>} title={model.filtered ? 'No transactions match' : 'No transactions yet'} text={model.filtered ? 'Try another search, type or date range.' : 'Payments into your wallet and transfers out will show here.'} className="py-2"/>}
        renderMobileCard={trx => <TransactionCard trx={trx} model={model}/>}/>}
    {!model.isError && (pagination.pages > 1 || model.rows.length > 0) && <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={pagination.setPage} pageSize={pagination.pageSize} onPageSizeChange={pagination.setPageSize} pageSizeOptions={[10, 20, 30, 50]}/>}
    <TransactionDetailsModal model={model}/>
  </section>
}
