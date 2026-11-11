import { useQuery } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { queryClient } from '@/lib/query-client'
import { useBusinessScope } from './business'
import { asRecord, isLive, listFrom, str } from './http'
import { queryKeys } from './query-keys'
import { sample } from './sample-data'

/**
 *  GET business/bank/{business_id}/  settlement accounts (also where a transfer checkout is received)
 *  GET wallet/banks/                 bank list + codes for transfers and the beneficiary enquiry
 */

export type BankAccount = { id: string; bankName: string; accountNumber: string; accountName: string }
export type BankOption = { code: string; name: string }

const getAccounts = async (businessId: string): Promise<BankAccount[]> => {
  if (!isLive()) return mockDelay([...sample.banks])
  const response = await apiRequest<unknown>(`business/bank/${businessId}/`)
  return listFrom(response, ['data', 'results', 'results.data']).map(value => {
    const record = asRecord(value)
    return { id: str(record.id), bankName: str(record.bank_name), accountNumber: str(record.account_number), accountName: str(record.account_name) }
  })
}

const accountsQuery = (scope: string) => ({ queryKey: [...queryKeys.settlementAccounts, scope], queryFn: () => getAccounts(scope) })

export const useSettlementAccounts = () => {
  const { scope, enabled } = useBusinessScope()
  return useQuery({ ...accountsQuery(scope), enabled })
}

export const fetchSettlementAccounts = (scope: string) => queryClient.fetchQuery({ ...accountsQuery(scope), staleTime: 5 * 60 * 1000 })

const getBankOptions = async (): Promise<BankOption[]> => {
  if (!isLive()) return mockDelay(sample.bankOptions)
  const response = await apiRequest<unknown>('wallet/banks/')
  return listFrom(response, ['data', 'results']).map(value => {
    const bank = asRecord(value)
    return { code: str(bank.bank_code) || str(bank.code) || str(bank.bankCode), name: str(bank.name) || str(bank.bank_name) }
  }).filter(bank => bank.code && bank.name)
}

const bankOptionsQuery = { queryKey: [...queryKeys.settlementAccounts, 'bank-options'] as const, queryFn: getBankOptions, staleTime: 60 * 60 * 1000 }

export const fetchBankOptions = () => queryClient.fetchQuery(bankOptionsQuery)

/** The transfer bank list (GET wallet/banks/), fetched once an hour at most. */
export const useBankOptions = (enabled = true) => useQuery({ ...bankOptionsQuery, enabled })

/** "GTBank ···· 8812" */
export const maskedAccount = (account: BankAccount) => `${account.bankName} ···· ${account.accountNumber.slice(-4)}`
