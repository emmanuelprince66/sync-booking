import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { queryClient } from '@/lib/query-client'
import { fetchCurrentBusiness, useBusinessScope, type BusinessBank } from './business'
import { fetchBankOptions, fetchSettlementAccounts } from './banks'
import { asRecord, at, isLive, num, str } from './http'
import { queryKeys } from './query-keys'
import { sample } from './sample-data'

/**
 * Balance and verification state, same calls as sink-inventory's wallet and KYC screens:
 *  GET  wallet/{bank_id}/?page=1&limit=30   → results.wallet_details.balance, results.tier, nin, bvn, address
 *  POST wallet/beneficiary_enquiry/         { bank_code, account_number } → { data: { ref } }
 *  POST wallet/transfer/{bank_id}/          { pin, ref, amount, narration }
 * The bank id comes from business.banks on the cached GET business/{id}/.
 */

export const MIN_WITHDRAWAL = 1000

export type WalletOverview = {
  /** Null until the business has opened a wallet account. */
  bankId: string | null
  balance: number
  tier: number
  /** Identity on file, so the verified banner can be shown. */
  verified: boolean
}

/** One cached GET wallet/{bank_id}/ for the wallet and KYC screens, however many ask at once. */
export const fetchWalletPage = (bankId: string) => queryClient.fetchQuery({
  queryKey: [...queryKeys.wallet, 'page', bankId] as const,
  staleTime: 60 * 1000,
  queryFn: () => apiRequest<unknown>(`wallet/${bankId}/?page=1&limit=30`),
})

const primaryBank = (banks: BusinessBank[]) => banks.find(account => !account.is_sub) ?? banks[0]

const getWallet = async (): Promise<WalletOverview> => {
  if (!isLive()) return mockDelay({ bankId: 'sample-bank-1', balance: sample.wallet.balance, tier: sample.wallet.tier, verified: sample.wallet.verified })
  const business = await fetchCurrentBusiness()
  const bank = primaryBank(business.banks)
  if (!bank) return { bankId: null, balance: 0, tier: 0, verified: false }
  const response = await fetchWalletPage(bank.id)
  const account = asRecord(asRecord(response).results)
  const tier = Number.parseInt(str(account.tier).replace(/\D/g, ''), 10) || 0
  return { bankId: bank.id, balance: num(at(account, 'wallet_details.balance')), tier, verified: tier > 0 && Boolean(account.nin || account.bvn || account.account_type === 'CORPORATE') }
}

export const useWalletOverview = () => {
  const { scope, enabled } = useBusinessScope()
  return useQuery({ queryKey: [...queryKeys.wallet, scope], queryFn: getWallet, enabled, staleTime: 60 * 1000 })
}

export type WithdrawInput = { amount: number; pin: string }

const withdraw = async (scope: string, { amount, pin }: WithdrawInput, bankId: string | null) => {
  if (!isLive()) {
    if (amount > sample.wallet.balance) throw new Error('Enter an amount within your available balance')
    sample.wallet = { ...sample.wallet, balance: sample.wallet.balance - amount }
    return mockDelay(null, 600)
  }
  if (!bankId) throw new Error('Complete KYC to open your wallet before withdrawing')
  const [account] = await fetchSettlementAccounts(scope)
  if (!account) throw new Error('Add a settlement account before withdrawing')
  const bank = (await fetchBankOptions()).find(option => option.name.toLowerCase() === account.bankName.toLowerCase())
  if (!bank) throw new Error(`We couldn't match ${account.bankName} to a bank code.`)
  const enquiry = await apiRequest<unknown>('wallet/beneficiary_enquiry/', { method: 'POST', body: { bank_code: bank.code, account_number: account.accountNumber } })
  const ref = str(at(enquiry, 'data.ref')) || str(at(enquiry, 'ref'))
  if (!ref) throw new Error('We could not verify your settlement account. Try again shortly.')
  return apiRequest<unknown>(`wallet/transfer/${bankId}/`, { method: 'POST', body: { pin, ref, amount, narration: 'Wallet withdrawal' } })
}

export const useWithdraw = (bankId: string | null) => {
  const { scope } = useBusinessScope()
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (input: WithdrawInput) => withdraw(scope, input, bankId), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallet }) })
}
