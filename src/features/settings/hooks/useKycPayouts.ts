import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { maskedAccount, useSettlementAccounts } from '@/api/banks'
import { useKycStatus } from '@/api/kyc'
import { noEndpointSample } from '@/api/sample-data'
import { useWalletOverview, useWithdraw } from '@/api/wallet'
import { useFormatMoney, useFormatMoneyCompact } from '@/hooks/useFormatMoney'
import { paths } from '@/routes/paths'
import { withdrawSchema, type WithdrawValues } from '../schemas'

/** KYC & payouts: the live balance, verification tier and settlement bank, and withdrawals. */
export function useKycPayouts() {
  const money = useFormatMoney()
  const moneyCompact = useFormatMoneyCompact()
  const navigate = useNavigate()
  const wallet = useWalletOverview()
  const kyc = useKycStatus()
  const accounts = useSettlementAccounts()
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const account = accounts.data?.[0]
  const tier = kyc.data?.tier ?? 0
  const verified = tier > 0
  const hasWallet = Boolean(wallet.data?.bankId)

  return {
    isLoading: wallet.isLoading,
    isError: wallet.isError,
    retry: () => void wallet.refetch(),
    balances: [
      { label: 'Available balance', value: money(wallet.data?.balance ?? 0), note: 'Ready to withdraw', isSample: false },
      { label: 'Pending payout', value: money(noEndpointSample.pendingPayout), note: noEndpointSample.pendingPayoutNote, isSample: true },
      { label: 'Total earned', value: moneyCompact(noEndpointSample.totalEarned), note: noEndpointSample.totalEarnedNote, isSample: true },
    ],
    verified,
    identityTitle: verified ? 'Identity verified' : 'Not verified yet',
    identityNote: verified ? `Tier ${tier} · Raise your tier any time for higher limits.` : 'Complete KYC to open your wallet and receive payouts.',
    kycActionLabel: verified ? 'Manage verification' : 'Start verification',
    goToKyc: () => navigate(paths.kyc),
    identityBadge: verified ? 'KYC COMPLETE' : 'KYC PENDING',
    payoutBank: account ? maskedAccount(account) : 'No settlement account yet',
    payoutBankLoading: accounts.isLoading,
    payoutSchedule: noEndpointSample.payoutSchedule,
    canWithdraw: hasWallet && Boolean(account) && (wallet.data?.balance ?? 0) > 0,
    withdrawOpen,
    openWithdraw: () => setWithdrawOpen(true),
    closeWithdraw: () => setWithdrawOpen(false),
    balance: wallet.data?.balance ?? 0,
    bankId: wallet.data?.bankId ?? null,
  }
}

export type KycPayoutsModel = ReturnType<typeof useKycPayouts>

export function useWithdrawForm(balance: number, bankId: string | null, onClose: () => void) {
  const money = useFormatMoney()
  const withdraw = useWithdraw(bankId)
  const schema = useMemo(() => withdrawSchema(balance), [balance])
  const form = useForm<WithdrawValues>({ resolver: zodResolver(schema), defaultValues: { amount: '', pin: '' } })
  return {
    register: form.register,
    errors: form.formState.errors,
    balanceLabel: money(balance),
    isSubmitting: withdraw.isPending,
    onSubmit: form.handleSubmit(async values => {
      try {
        await withdraw.mutateAsync({ amount: Number(values.amount), pin: values.pin })
        toast.success('Withdrawal request submitted')
        onClose()
      } catch (error) {
        toast.error(errorMessage(error, 'Could not complete this withdrawal.'))
      }
    }),
  }
}
