import { useState } from 'react'
import { useNavigate } from 'react-router'
import { maskedAccount, useSettlementAccounts } from '@/api/banks'
import { useKycStatus } from '@/api/kyc'
import { useWalletOverview } from '@/api/wallet'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { paths } from '@/routes/paths'
import type { TransferPreset } from './useTransferFlow'

/** KYC & payouts: the live balance, verification tier and settlement bank, and transfers out of the wallet. */
export function useKycPayouts() {
  const money = useFormatMoney()
  const navigate = useNavigate()
  const wallet = useWalletOverview()
  const kyc = useKycStatus()
  const accounts = useSettlementAccounts()
  // undefined = closed; null = open on a blank recipient; a preset = open on the payout bank.
  const [transfer, setTransfer] = useState<TransferPreset | null | undefined>(undefined)
  const account = accounts.data?.[0]
  const tier = kyc.data?.tier ?? 0
  const verified = tier > 0
  const data = wallet.data
  const hasWallet = Boolean(data?.bankId)
  const canTransfer = hasWallet && (data?.balance ?? 0) > 0

  return {
    isLoading: wallet.isLoading,
    isError: wallet.isError,
    retry: () => void wallet.refetch(),
    balanceLabel: money(data?.balance ?? 0),
    inflowLabel: money(data?.inflow ?? 0),
    outflowLabel: money(data?.outflow ?? 0),
    walletAccount: data?.accountNumber ? `${data.bankName ? `${data.bankName} · ` : ''}${data.accountNumber}` : '',
    balanceNote: !hasWallet ? 'Complete KYC to open your wallet' : canTransfer ? 'Send to any Nigerian bank account' : 'Your balance is empty',
    verified,
    identityTitle: verified ? 'Identity verified' : 'Not verified yet',
    identityNote: verified ? `Tier ${tier} · Raise your tier any time for higher limits.` : 'Complete KYC to open your wallet and receive payouts.',
    kycActionLabel: verified ? 'Manage verification' : 'Start verification',
    goToKyc: () => navigate(paths.kyc),
    identityBadge: verified ? 'KYC COMPLETE' : 'KYC PENDING',
    payoutBank: account ? maskedAccount(account) : 'No settlement account yet',
    payoutBankLoading: accounts.isLoading,
    canTransfer,
    canWithdraw: canTransfer && Boolean(account),
    openTransfer: () => setTransfer(null),
    openWithdraw: () => { if (account) setTransfer({ bankName: account.bankName, accountNumber: account.accountNumber }) },
    transferOpen: transfer !== undefined,
    transferPreset: transfer ?? undefined,
    closeTransfer: () => setTransfer(undefined),
    bankId: data?.bankId ?? null,
    balance: data?.balance ?? 0,
    hasPin: data?.hasPin ?? false,
    senderName: data?.accountName ?? '',
  }
}

export type KycPayoutsModel = ReturnType<typeof useKycPayouts>
