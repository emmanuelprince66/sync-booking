import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { queryClient } from '@/lib/query-client'
import { fetchCurrentBusiness, requireBusinessId, useBusinessScope, type BusinessBank } from './business'
import { asRecord, at, isLive, listFrom, num, str } from './http'
import { queryKeys } from './query-keys'
import { sample, type SampleWalletTrx } from './sample-data'

/**
 * The business wallet, with the same calls sink-inventory's Transactions screen makes
 * (hooks/useTransactionsHook, api/transactions/*, settings/pin):
 *  GET  wallet/{bank_id}/?page&limit&search&type&start_date&end_date
 *       → { results: { wallet_details, inflow, outflow, transactions, tier, nin, bvn }, pages, total }
 *  GET  wallet/banks/                                   transfer bank list (api/banks.ts)
 *  POST wallet/beneficiary_enquiry/       { bank_code, account_number } → { name, ref } (400 { message } when not found)
 *  GET  wallet/recent_beneficiaries/{bank_id}/?limit=6  accounts paid before
 *  GET  category/business/{business_id}/?type=EXPENSES  optional transfer category
 *  POST wallet/set_pin/{business_id}/      { pin }      4-digit wallet PIN, when business.pin is empty
 *  POST wallet/transfer/{bank_id}/         { pin, ref, amount, narration, category? } → { message, reference } (202 = still processing)
 * The bank id is the primary account in business.banks (is_sub !== true).
 */

export const TRANSACTIONS_PAGE_SIZE = 10
export const WALLET_PIN_LENGTH = 4

export type TransactionType = 'CREDIT' | 'DEBIT'
export type TransactionFilters = { page: number; limit: number; search: string; type: TransactionType | ''; startDate: string; endDate: string }
export const DEFAULT_TRANSACTION_FILTERS: TransactionFilters = { page: 1, limit: TRANSACTIONS_PAGE_SIZE, search: '', type: '', startDate: '', endDate: '' }

/** sink's transfer fee: ₦10 up to ₦5,000, ₦25 up to ₦50,000, ₦50 above. */
export const transferCharge = (amount: number) => (!(amount > 0) ? 0 : amount <= 5000 ? 10 : amount <= 50000 ? 25 : 50)

const MOCK_BANK_ID = 'sample-bank-1'
/** Mock mode's wallet PIN; replaced when the PIN is created in the transfer flow. */
const mockPin = { value: '1234' }

// ─── GET wallet/{bank_id}/ (one cache entry per bank + filters) ─────────────

const walletPageParams = (filters: TransactionFilters) => {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) })
  if (filters.search) params.set('search', filters.search)
  if (filters.type) params.set('type', filters.type)
  if (filters.startDate) params.set('start_date', filters.startDate)
  if (filters.endDate) params.set('end_date', filters.endDate)
  return params.toString()
}

const mockWalletPage = (filters: TransactionFilters) => {
  const term = filters.search.toLowerCase()
  const day = (iso: string) => iso.slice(0, 10)
  const rows = sample.walletTransactions.filter(trx =>
    (!filters.type || trx.type === filters.type)
    && (!term || [trx.account_name, trx.description, trx.transaction_id].some(value => value.toLowerCase().includes(term)))
    && (!filters.startDate || day(trx.created_at) >= filters.startDate)
    && (!filters.endDate || day(trx.created_at) <= filters.endDate))
  const sum = (type: TransactionType) => sample.walletTransactions.filter(trx => trx.type === type && trx.status === 'SUCCESS').reduce((total, trx) => total + trx.amount, 0)
  const start = (filters.page - 1) * filters.limit
  return {
    results: {
      tier: `TIER ${sample.wallet.tier}`,
      nin: sample.wallet.verified ? 'sample' : '',
      wallet_details: { balance: sample.wallet.balance, account_name: sample.wallet.accountName, account_number: sample.wallet.accountNumber, bank_name: sample.wallet.bankName },
      inflow: sum('CREDIT'),
      outflow: sum('DEBIT'),
      transactions: rows.slice(start, start + filters.limit),
    },
    pages: Math.max(Math.ceil(rows.length / filters.limit), 1),
    total: rows.length,
  }
}

const walletPageQuery = (bankId: string, filters: TransactionFilters) => ({
  queryKey: [...queryKeys.wallet, 'page', bankId, filters] as const,
  queryFn: () => (isLive() ? apiRequest<unknown>(`wallet/${bankId}/?${walletPageParams(filters)}`) : mockDelay<unknown>(mockWalletPage(filters))),
  staleTime: 60 * 1000,
})

/**
 * One cached GET wallet/{bank_id}/ for the balance card, the KYC screen and the
 * first page of transactions: they all ask with the default filters, so they share it.
 */
export const fetchWalletPage = (bankId: string, filters: TransactionFilters = DEFAULT_TRANSACTION_FILTERS) => queryClient.fetchQuery(walletPageQuery(bankId, filters))

// ─── Overview (balance card) ────────────────────────────────────────────────

export type WalletOverview = {
  /** Null until the business has opened a wallet account. */
  bankId: string | null
  balance: number
  tier: number
  /** Identity on file, so the verified banner can be shown. */
  verified: boolean
  /** sink: businessData.pin — false means "create a PIN" before the first transfer. */
  hasPin: boolean
  accountName: string
  accountNumber: string
  bankName: string
  inflow: number
  outflow: number
}

const primaryBank = (banks: BusinessBank[]) => banks.find(account => !account.is_sub) ?? banks[0]

const mapOverview = (bankId: string, response: unknown, hasPin: boolean, bank?: BusinessBank): WalletOverview => {
  const account = asRecord(asRecord(response).results)
  const details = asRecord(account.wallet_details)
  const tier = Number.parseInt(str(account.tier).replace(/\D/g, ''), 10) || 0
  return {
    bankId,
    balance: num(details.balance),
    tier,
    verified: tier > 0 && Boolean(account.nin || account.bvn || account.account_type === 'CORPORATE'),
    hasPin,
    accountName: str(details.account_name) || bank?.account_name || '',
    accountNumber: str(details.account_number) || bank?.account_number || '',
    bankName: str(details.bank_name) || bank?.bank_name || '',
    inflow: num(account.inflow),
    outflow: num(account.outflow),
  }
}

const getWallet = async (): Promise<WalletOverview> => {
  if (!isLive()) return mapOverview(MOCK_BANK_ID, await fetchWalletPage(MOCK_BANK_ID), sample.wallet.hasPin)
  const business = await fetchCurrentBusiness()
  const bank = primaryBank(business.banks)
  const hasPin = Boolean(business.raw.pin)
  if (!bank) return { bankId: null, balance: 0, tier: 0, verified: false, hasPin, accountName: '', accountNumber: '', bankName: '', inflow: 0, outflow: 0 }
  return mapOverview(bank.id, await fetchWalletPage(bank.id), hasPin, bank)
}

export const useWalletOverview = () => {
  const { scope, enabled } = useBusinessScope()
  return useQuery({ queryKey: [...queryKeys.wallet, scope], queryFn: getWallet, enabled, staleTime: 60 * 1000 })
}

// ─── Transactions ───────────────────────────────────────────────────────────

export type WalletTransaction = {
  id: string
  type: TransactionType
  amount: number
  charges: number
  accountName: string
  accountNumber: string
  bankName: string
  description: string
  channel: string
  status: string
  createdAt: string
  /** sink's extractTransactionId: the provider's reference when there is one. */
  reference: string
}

export type WalletTransactionsPage = { transactions: WalletTransaction[]; pages: number; total: number }

const mapTransaction = (value: unknown, index: number): WalletTransaction => {
  const trx = asRecord(value)
  return {
    id: str(trx.id) || `trx-${index}`,
    type: str(trx.type).toUpperCase() === 'CREDIT' ? 'CREDIT' : 'DEBIT',
    amount: num(trx.amount),
    charges: num(trx.charges),
    accountName: str(trx.account_name),
    accountNumber: str(trx.account_number),
    bankName: str(trx.bank_name),
    description: str(trx.description) || str(trx.narration),
    channel: str(trx.mode) || str(trx.source) || '',
    status: str(trx.status).toUpperCase() || 'PENDING',
    createdAt: str(trx.created_at),
    reference: str(trx.transaction_id) || str(trx.reference) || str(trx.session_id) || str(trx.id),
  }
}

const mapTransactionsPage = (response: unknown): WalletTransactionsPage => ({
  transactions: listFrom(response, ['results.transactions', 'data.results.transactions', 'results.data']).map(mapTransaction),
  pages: Math.max(num(at(response, 'pages')) || num(at(response, 'results.pages')) || 1, 1),
  total: num(at(response, 'total')) || num(at(response, 'results.total')),
})

/** A page of wallet credits and debits. Keeps the previous page on screen while the next loads. */
export const useWalletTransactions = (bankId: string | null, filters: TransactionFilters) =>
  useQuery({ ...walletPageQuery(bankId ?? '', filters), enabled: Boolean(bankId), placeholderData: keepPreviousData, select: mapTransactionsPage })

// ─── Transfer ───────────────────────────────────────────────────────────────

/** Balance, KYC and transaction pages; leaves the name enquiry and categories alone so they aren't re-requested. */
const refreshWallet = (client: ReturnType<typeof useQueryClient>) =>
  client.invalidateQueries({ queryKey: queryKeys.wallet, predicate: query => !['beneficiary', 'expense-categories'].includes(String(query.queryKey[1])) })

export type Beneficiary = { name: string; ref: string }
export type RecentBeneficiary = { accountName: string; accountNumber: string; bankName: string; bankCode: string }
export type ExpenseCategory = { id: string; name: string }

const enquire = async (bankCode: string, accountNumber: string): Promise<Beneficiary> => {
  if (!isLive()) {
    await mockDelay(null, 700)
    if (accountNumber.startsWith('000')) throw new Error('We couldn’t verify this account. Check the bank and account number.')
    const known = sample.recentBeneficiaries.find(row => row.account_number === accountNumber)
    const payout = sample.banks.find(account => account.accountNumber === accountNumber)
    return { name: known?.account_name ?? payout?.accountName.toUpperCase() ?? 'ADAEZE OKAFOR', ref: `mock-ref-${accountNumber}` }
  }
  const response = await apiRequest<unknown>('wallet/beneficiary_enquiry/', { method: 'POST', body: { bank_code: bankCode, account_number: accountNumber } })
  const name = str(at(response, 'data.name')) || str(at(response, 'name')) || str(at(response, 'data.account_name'))
  const ref = str(at(response, 'data.ref')) || str(at(response, 'ref'))
  if (!name || !ref) throw new Error('We couldn’t verify this account. Check the bank and account number.')
  return { name, ref }
}

/** sink runs the name enquiry on its own once a bank is picked and the number has 10 digits. */
export const useBeneficiaryEnquiry = (bankCode: string, accountNumber: string) =>
  useQuery({
    queryKey: [...queryKeys.wallet, 'beneficiary', bankCode, accountNumber],
    queryFn: () => enquire(bankCode, accountNumber),
    enabled: Boolean(bankCode) && accountNumber.length === 10,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

const getRecentBeneficiaries = async (bankId: string): Promise<RecentBeneficiary[]> => {
  const response = isLive() ? await apiRequest<unknown>(`wallet/recent_beneficiaries/${bankId}/?limit=6`) : await mockDelay<unknown>(sample.recentBeneficiaries)
  return listFrom(response, ['data', 'results', 'data.results']).map(value => {
    const row = asRecord(value)
    return { accountName: str(row.account_name), accountNumber: str(row.account_number), bankName: str(row.bank_name), bankCode: str(row.bank_code) }
  }).filter(row => row.accountNumber)
}

export const useRecentBeneficiaries = (bankId: string | null, enabled: boolean) =>
  useQuery({ queryKey: [...queryKeys.wallet, 'recent-beneficiaries', bankId], queryFn: () => getRecentBeneficiaries(bankId as string), enabled: enabled && Boolean(bankId), staleTime: 5 * 60 * 1000 })

const getExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  const response = isLive() ? await apiRequest<unknown>(`category/business/${requireBusinessId()}/?type=EXPENSES`) : await mockDelay<unknown>(sample.expenseCategories)
  return listFrom(response, ['data', 'results', 'data.results', 'results.data'])
    .map(value => ({ id: str(asRecord(value).id), name: str(asRecord(value).name) }))
    .filter(category => category.id && category.name)
}

export const useExpenseCategories = (enabled: boolean) => {
  const { scope, enabled: ready } = useBusinessScope()
  return useQuery({ queryKey: [...queryKeys.wallet, 'expense-categories', scope], queryFn: getExpenseCategories, enabled: enabled && ready, staleTime: 5 * 60 * 1000 })
}

const setPin = async (pin: string) => {
  if (!isLive()) {
    sample.wallet = { ...sample.wallet, hasPin: true }
    mockPin.value = pin
    return mockDelay(null, 600)
  }
  return apiRequest<unknown>(`wallet/set_pin/${requireBusinessId()}/`, { method: 'POST', body: { pin } })
}

/** Creates the wallet PIN, then refreshes the business record (business.pin) and the wallet. */
export const useSetWalletPin = () => {
  const client = useQueryClient()
  return useMutation({
    mutationFn: setPin,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.business })
      void refreshWallet(client)
    },
  })
}

export type TransferInput = {
  bankId: string
  pin: string
  ref: string
  amount: number
  narration: string
  categoryId?: string
  /** For the mock ledger row only; the API resolves the beneficiary from `ref`. */
  beneficiary: { name: string; accountNumber: string; bankName: string }
}

const mockTransfer = async ({ pin, amount, narration, beneficiary }: TransferInput) => {
  await mockDelay(null, 900)
  if (pin !== mockPin.value) throw new Error('Incorrect PIN. Try again.')
  const fee = transferCharge(amount)
  if (amount + fee > sample.wallet.balance) throw new Error('Insufficient balance for this transfer.')
  const reference = `CB${Date.now()}`
  const row: SampleWalletTrx = {
    id: `sample-trx-${Date.now()}`, type: 'DEBIT', amount, charges: fee, account_name: beneficiary.name, account_number: beneficiary.accountNumber,
    bank_name: beneficiary.bankName, description: narration || 'Transfer', mode: 'TRANSFER', status: 'SUCCESS', created_at: new Date().toISOString(), transaction_id: reference,
  }
  sample.wallet = { ...sample.wallet, balance: sample.wallet.balance - amount - fee }
  sample.walletTransactions = [row, ...sample.walletTransactions]
  return { data: { transaction_id: reference } }
}

const transfer = (input: TransferInput): Promise<unknown> => {
  if (!isLive()) return mockTransfer(input)
  const { bankId, pin, ref, amount, narration, categoryId } = input
  return apiRequest<unknown>(`wallet/transfer/${bankId}/`, {
    method: 'POST',
    body: { pin, ref, amount: amount.toFixed(2), narration, ...(categoryId ? { category: categoryId } : {}) },
  })
}

/** Sends money out of the wallet, then refreshes the balance and every transactions page. */
export const useTransfer = () => {
  const client = useQueryClient()
  return useMutation({ mutationFn: transfer, onSuccess: () => refreshWallet(client) })
}

/** sink's extractTransactionId: the provider reference from a transfer response. */
export const extractTransactionId = (response: unknown) =>
  str(at(response, 'data.transaction_id')) || str(at(response, 'transaction_id')) || str(at(response, 'data.reference')) || str(at(response, 'reference')) || str(at(response, 'data.id')) || ''
