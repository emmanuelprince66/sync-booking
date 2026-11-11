import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useBankOptions } from '@/api/banks'
import {
  extractTransactionId, transferCharge, useBeneficiaryEnquiry, useExpenseCategories, useRecentBeneficiaries, useSetWalletPin, useTransfer,
  WALLET_PIN_LENGTH, type RecentBeneficiary,
} from '@/api/wallet'
import { useFormatMoney } from '@/hooks/useFormatMoney'

export type TransferStep = 'pin' | 'recipient' | 'amount' | 'confirm' | 'done'

export type TransferReceipt = {
  amount: number
  fee: number
  beneficiaryName: string
  accountNumber: string
  bankName: string
  narration: string
  category: string
  reference: string
  date: string
  senderName: string
}

/** A known account to start from, e.g. the payout bank ("Withdraw to payout bank"). */
export type TransferPreset = { bankName: string; accountNumber: string }

type Options = {
  bankId: string | null
  balance: number
  hasPin: boolean
  senderName: string
  preset?: TransferPreset
  onClose: () => void
}

const STEP_NUMBER: Record<TransferStep, number> = { pin: 0, recipient: 1, amount: 2, confirm: 3, done: 3 }

/**
 * sink-inventory's wallet transfer: create a wallet PIN first if the business has
 * none, then bank + 10-digit account with automatic name enquiry (or a recent
 * beneficiary), amount with sink's fee and a balance check, optional category and
 * narration, then the 4-digit PIN, then a receipt. Mounted only while open, so
 * closing throws all of this away.
 */
export function useTransferFlow({ bankId, balance, hasPin, senderName, preset, onClose }: Options) {
  const money = useFormatMoney()
  const [step, setStep] = useState<TransferStep>(hasPin ? 'recipient' : 'pin')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pickedBankCode, setPickedBankCode] = useState('')
  const [accountNumber, setAccountNumberState] = useState(preset?.accountNumber ?? '')
  const [amount, setAmountState] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [narration, setNarration] = useState('')
  const [pin, setPinState] = useState('')
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<TransferReceipt | null>(null)

  const banks = useBankOptions()
  const recent = useRecentBeneficiaries(bankId, step === 'recipient')
  const categories = useExpenseCategories(step === 'amount' || step === 'confirm')
  const createPin = useSetWalletPin()
  const transfer = useTransfer()

  const bankOptions = useMemo(() => (banks.data ?? []).map(bank => ({ value: bank.code, label: bank.name })), [banks.data])
  // The payout bank is stored by name; its code comes from the transfer bank list.
  const presetCode = preset ? bankOptions.find(option => option.label.toLowerCase() === preset.bankName.toLowerCase())?.value ?? '' : ''
  const bankCode = pickedBankCode || presetCode
  const bankName = bankOptions.find(option => option.value === bankCode)?.label ?? ''
  const enquiry = useBeneficiaryEnquiry(bankCode, accountNumber)
  const beneficiary = enquiry.data ?? null

  const amountValue = Number(amount) || 0
  const fee = transferCharge(amountValue)
  const total = amountValue + fee
  const categoryName = categories.data?.find(category => category.id === categoryId)?.name ?? ''

  const goTo = (next: TransferStep) => { setError(''); setStep(next) }

  const submitNewPin = () => {
    if (!new RegExp(`^\\d{${WALLET_PIN_LENGTH}}$`).test(newPin)) return setError(`Choose a ${WALLET_PIN_LENGTH}-digit PIN.`)
    if (newPin !== confirmPin) return setError('The two PINs do not match.')
    createPin.mutate(newPin, {
      onSuccess: () => { toast.success('Wallet PIN created'); goTo('recipient') },
      onError: pinError => setError(errorMessage(pinError, 'Could not create your PIN. Try again.')),
    })
  }

  const continueFromRecipient = () => {
    if (!bankCode || accountNumber.length !== 10) return setError('Select a bank and enter a valid 10-digit account number.')
    if (!beneficiary) return setError('Wait for the account name to be confirmed.')
    goTo('amount')
  }

  const continueFromAmount = () => {
    if (!(amountValue > 0)) return setError('Enter the amount to send.')
    if (total > balance) return setError(`Insufficient balance. With the ${money(fee)} fee you can send up to ${money(Math.max(balance - transferCharge(balance), 0))}.`)
    goTo('confirm')
  }

  const send = () => {
    if (pin.length !== WALLET_PIN_LENGTH) return setError(`Enter your ${WALLET_PIN_LENGTH}-digit wallet PIN.`)
    if (!bankId || !beneficiary) return setError('Your wallet account isn’t ready yet. Complete KYC first.')
    transfer.mutate({ bankId, pin, ref: beneficiary.ref, amount: amountValue, narration: narration.trim(), categoryId: categoryId || undefined, beneficiary: { name: beneficiary.name, accountNumber, bankName } }, {
      onSuccess: response => {
        toast.success('Transfer successful')
        setReceipt({ amount: amountValue, fee, beneficiaryName: beneficiary.name, accountNumber, bankName, narration: narration.trim(), category: categoryName, reference: extractTransactionId(response), date: new Date().toISOString(), senderName })
        goTo('done')
      },
      onError: sendError => { setPinState(''); setError(errorMessage(sendError, 'Transfer failed. Please try again.')) },
    })
  }

  const back = () => {
    if (step === 'amount') return goTo('recipient')
    if (step === 'confirm') return goTo('amount')
    onClose()
  }

  return {
    step,
    stepNumber: STEP_NUMBER[step],
    stepCount: 3,
    error,
    close: onClose,
    back,
    backLabel: step === 'amount' ? 'Back to recipient' : step === 'confirm' ? 'Back to amount' : '',
    pinSetup: {
      pin: newPin,
      setPin: (value: string) => { setNewPin(value); setError('') },
      confirm: confirmPin,
      setConfirm: (value: string) => { setConfirmPin(value); setError('') },
      submit: submitNewPin,
      submitting: createPin.isPending,
      canSubmit: newPin.length === WALLET_PIN_LENGTH && confirmPin.length === WALLET_PIN_LENGTH,
      skip: () => goTo('recipient'),
    },
    recipient: {
      bankOptions,
      banksLoading: banks.isLoading,
      bankCode,
      setBankCode: (code: string) => { setPickedBankCode(code); setError('') },
      accountNumber,
      setAccountNumber: (value: string) => { setAccountNumberState(value.replace(/\D/g, '').slice(0, 10)); setError('') },
      resolving: enquiry.isFetching,
      beneficiaryName: beneficiary?.name ?? '',
      bankName,
      resolveFailed: enquiry.isError && !enquiry.isFetching,
      resolveError: enquiry.isError ? errorMessage(enquiry.error, 'We couldn’t verify this account.') : '',
      retryResolve: () => { void enquiry.refetch() },
      recent: recent.data ?? [],
      recentLoading: recent.isLoading,
      applyRecent: (row: RecentBeneficiary) => {
        const match = bankOptions.find(option => option.value === row.bankCode || option.label.toLowerCase() === row.bankName.toLowerCase())
        if (match) setPickedBankCode(match.value)
        setAccountNumberState(row.accountNumber)
        setError('')
      },
      canContinue: Boolean(beneficiary) && !enquiry.isFetching,
      continue: continueFromRecipient,
    },
    amount: {
      value: amount,
      set: (value: string) => { setAmountState(value.replace(/[^\d.]/g, '')); setError('') },
      balanceLabel: money(balance),
      feeLabel: money(fee),
      totalLabel: money(total),
      overBalance: total > balance,
      categoryOptions: (categories.data ?? []).map(category => ({ value: category.id, label: category.name })),
      categoriesLoading: categories.isLoading,
      categoryId,
      setCategoryId,
      narration,
      setNarration,
      continue: continueFromAmount,
    },
    confirm: {
      summary: [
        { label: 'To', value: beneficiary?.name ?? '' },
        { label: 'Account', value: `${accountNumber} · ${bankName}` },
        { label: 'Amount', value: money(amountValue) },
        { label: 'Transfer fee', value: money(fee) },
        ...(categoryName ? [{ label: 'Category', value: categoryName }] : []),
        ...(narration.trim() ? [{ label: 'Narration', value: narration.trim() }] : []),
      ],
      totalLabel: money(total),
      sendLabel: `Send ${money(amountValue)}`,
      pin,
      setPin: (value: string) => { setPinState(value); setError('') },
      submit: send,
      submitting: transfer.isPending,
    },
    receipt: receipt && {
      amountLabel: money(receipt.amount),
      rows: [
        { label: 'Beneficiary', value: receipt.beneficiaryName },
        { label: 'Account number', value: receipt.accountNumber },
        { label: 'Bank', value: receipt.bankName },
        { label: 'Transfer fee', value: money(receipt.fee) },
        { label: 'Total debited', value: money(receipt.amount + receipt.fee) },
        ...(receipt.category ? [{ label: 'Category', value: receipt.category }] : []),
        ...(receipt.narration ? [{ label: 'Narration', value: receipt.narration }] : []),
        ...(receipt.senderName ? [{ label: 'From', value: receipt.senderName }] : []),
        { label: 'Reference', value: receipt.reference || '—' },
        { label: 'Date', value: new Date(receipt.date).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) },
      ],
    },
  }
}

export type TransferFlow = ReturnType<typeof useTransferFlow>
