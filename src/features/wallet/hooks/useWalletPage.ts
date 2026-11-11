import { useState } from 'react'
import { useNavigate } from 'react-router'
import { maskedAccount, useSettlementAccounts } from '@/api/banks'
import { useWalletOverview } from '@/api/wallet'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { paths } from '@/routes/paths'
import type { PinMode } from './usePinFlow'
import type { TransferPreset } from './useTransferFlow'

/**
 * The Wallet page: balance, withdraw to the payout bank, transfer to any account,
 * the transaction PIN and the transactions list. GET wallet/{bank_id}/ is shared
 * (one cache entry) by the balance card and the first transactions page.
 */
export function useWalletPage() {
  const money = useFormatMoney()
  const navigate = useNavigate()
  const wallet = useWalletOverview()
  const accounts = useSettlementAccounts()
  // undefined = closed; null = open on a blank recipient; a preset = open on the payout bank.
  const [transfer, setTransfer] = useState<TransferPreset | null | undefined>(undefined)
  const [pinMode, setPinMode] = useState<PinMode | null>(null)
  const data = wallet.data
  const payout = accounts.data?.[0]
  const hasWallet = Boolean(data?.bankId)
  const balance = data?.balance ?? 0
  const hasBalance = hasWallet && balance > 0
  const hasPin = data?.hasPin ?? false

  return {
    isLoading: wallet.isLoading,
    isError: wallet.isError,
    retry: () => void wallet.refetch(),
    hasWallet,
    goToKyc: () => navigate(paths.kyc),
    balance: {
      label: money(balance),
      note: !hasWallet ? 'Complete KYC to open your wallet' : hasBalance ? 'Available to withdraw or transfer' : 'Your balance is empty',
      account: data?.accountNumber ? `${data.bankName ? `${data.bankName} · ` : ''}${data.accountNumber}` : '',
      accountName: data?.accountName ?? '',
      inflow: money(data?.inflow ?? 0),
      outflow: money(data?.outflow ?? 0),
    },
    withdraw: {
      enabled: hasBalance && Boolean(payout),
      /** Why Withdraw is off, when it is. */
      hint: !hasWallet ? '' : !payout && !accounts.isLoading ? 'Add a payout bank to withdraw.' : '',
      open: () => { if (payout) setTransfer({ bankName: payout.bankName, accountNumber: payout.accountNumber }) },
    },
    payout: {
      loading: accounts.isLoading,
      label: payout ? maskedAccount(payout) : 'No payout bank yet',
      name: payout?.accountName ?? '',
      missing: !accounts.isLoading && !payout,
    },
    transfer: {
      enabled: hasBalance,
      open: () => setTransfer(null),
      isOpen: transfer !== undefined,
      preset: transfer ?? undefined,
      close: () => setTransfer(undefined),
    },
    pin: {
      isSet: hasPin,
      statusLabel: hasPin ? 'Set' : 'Not set',
      note: hasPin ? 'Required to approve every withdrawal and transfer.' : 'Set a 4-digit PIN before your first withdrawal or transfer.',
      mode: pinMode,
      open: (mode: PinMode) => setPinMode(mode),
      close: () => setPinMode(null),
    },
    bankId: data?.bankId ?? null,
    rawBalance: balance,
    senderName: data?.accountName ?? '',
  }
}

export type WalletPageModel = ReturnType<typeof useWalletPage>
