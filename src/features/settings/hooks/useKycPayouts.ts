import { useNavigate } from 'react-router'
import { maskedAccount, useSettlementAccounts } from '@/api/banks'
import { useKycStatus } from '@/api/kyc'
import { useWalletOverview } from '@/api/wallet'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { paths } from '@/routes/paths'

/** KYC & payouts: verification tier, settlement bank and a short balance summary; withdrawals live on the Wallet page. */
export function useKycPayouts() {
  const money = useFormatMoney()
  const navigate = useNavigate()
  const wallet = useWalletOverview()
  const kyc = useKycStatus()
  const accounts = useSettlementAccounts()
  const account = accounts.data?.[0]
  const tier = kyc.data?.tier ?? 0
  const verified = tier > 0
  const data = wallet.data

  return {
    balanceLoading: wallet.isLoading,
    balanceError: wallet.isError,
    balanceLabel: money(data?.balance ?? 0),
    balanceNote: !data?.bankId ? 'Complete KYC to open your wallet' : data.accountNumber ? `Wallet · ${data.bankName ? `${data.bankName} · ` : ''}${data.accountNumber}` : 'Business wallet',
    goToWallet: () => navigate(paths.wallet),
    verified,
    identityTitle: verified ? 'Identity verified' : 'Not verified yet',
    identityNote: verified ? `Tier ${tier} · Raise your tier any time for higher limits.` : 'Complete KYC to open your wallet and receive payouts.',
    kycActionLabel: verified ? 'Manage verification' : 'Start verification',
    goToKyc: () => navigate(paths.kyc),
    identityBadge: verified ? 'KYC COMPLETE' : 'KYC PENDING',
    payoutBank: account ? maskedAccount(account) : 'No settlement account yet',
    payoutBankLoading: accounts.isLoading,
  }
}

export type KycPayoutsModel = ReturnType<typeof useKycPayouts>
