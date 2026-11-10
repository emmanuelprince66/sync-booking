import { Banknote, CreditCard, Receipt, Wallet, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { DEFAULT_SETTINGS, useBookingSettings, useSaveBookingSettings } from '@/api/availability'
import { bnplErrorMessage, useSetBnpl, useStorefrontProfile } from '@/api/storefront'

type PaymentChoice = 'allowFullPayment' | 'allowDeposit' | 'allowPayAtBusiness'

const CHOICES: { key: PaymentChoice; name: string; note: string; icon: LucideIcon }[] = [
  { key: 'allowFullPayment', name: 'Full payment', note: 'Clients pay online when booking', icon: CreditCard },
  { key: 'allowDeposit', name: 'Deposit', note: 'A part payment secures the slot', icon: Banknote },
  { key: 'allowPayAtBusiness', name: 'Pay at venue', note: 'Cash or POS on arrival', icon: Receipt },
]

/**
 * Sink's rule: the merchant picks exactly one way to pay at booking; the API
 * stores three booleans, so a choice is written as one true and two false.
 * Older settings may have several on, in which case the first in this order wins.
 */
export function usePaymentOptions() {
  const settingsQuery = useBookingSettings()
  const profileQuery = useStorefrontProfile()
  const save = useSaveBookingSettings()
  const setBnpl = useSetBnpl()
  const settings = settingsQuery.data ?? DEFAULT_SETTINGS
  const savedChoice = CHOICES.find(({ key }) => settings[key])?.key ?? 'allowFullPayment'
  const [choiceDraft, setChoice] = useState<PaymentChoice | null>(null)
  const [depositDraft, setDeposit] = useState<string | null>(null)
  const choice = choiceDraft ?? savedChoice
  const deposit = depositDraft ?? String(settings.minDepositPercentage)
  const depositValid = Number.isInteger(Number(deposit)) && Number(deposit) >= 1 && Number(deposit) <= 100
  const bnplEnabled = profileQuery.data?.enableBnpl ?? false

  return {
    isLoading: settingsQuery.isLoading,
    isError: settingsQuery.isError,
    retry: () => void settingsQuery.refetch(),
    options: CHOICES.map(option => ({ ...option, enabled: option.key === choice, select: () => setChoice(option.key) })),
    bnpl: { name: 'Buy now, pay later', note: 'Split into instalments', icon: Wallet, enabled: bnplEnabled },
    toggleBnpl: async (enabled: boolean) => {
      try {
        await setBnpl.mutateAsync(enabled)
        toast.success(enabled ? 'Buy now, pay later is on' : 'Buy now, pay later is off')
      } catch (error) {
        toast.error(bnplErrorMessage(error))
      }
    },
    isBnplSaving: setBnpl.isPending,
    showDeposit: choice === 'allowDeposit',
    deposit,
    setDeposit,
    depositError: depositValid ? undefined : 'Enter a percentage from 1 to 100',
    isSaving: save.isPending,
    saveOptions: async () => {
      if (!depositValid) return
      try {
        await save.mutateAsync({ allowFullPayment: choice === 'allowFullPayment', allowDeposit: choice === 'allowDeposit', allowPayAtBusiness: choice === 'allowPayAtBusiness', minDepositPercentage: Number(deposit) })
        setChoice(null)
        setDeposit(null)
        toast.success('Payment options saved')
      } catch (error) {
        toast.error(errorMessage(error, 'Could not save your payment options.'))
      }
    },
  }
}
