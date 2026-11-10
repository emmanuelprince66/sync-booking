import { useCallback } from 'react'
import { formatMoney, formatMoneyCompact } from '@/lib/money'
import { useBusinessDataStore } from '@/stores/business-data-store'

const useBusinessCurrency = () => useBusinessDataStore(state => state.businessData?.currency) || 'NGN'

/** Formats amounts in the selected business's currency (naira by default), as sink-inventory's useFormatMoney does. */
export function useFormatMoney() {
  const currency = useBusinessCurrency()
  return useCallback((amount: number) => formatMoney(amount, currency), [currency])
}

/** Same currency, short form for stat cards ("₦248K"). */
export function useFormatMoneyCompact() {
  const currency = useBusinessCurrency()
  return useCallback((amount: number) => formatMoneyCompact(amount, currency), [currency])
}
