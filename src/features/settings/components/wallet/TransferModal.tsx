import { AlertCircle, CheckCircle2, KeyRound, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SuccessIcon } from '@/components/ui/common'
import { Field, TextareaField } from '@/components/ui/Field'
import { BackLink } from '@/components/ui/misc'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'
import { OptionSelect } from '@/components/ui/OptionSelect'
import { OtpInput } from '@/components/ui/OtpInput'
import { Skeleton } from '@/components/ui/Skeleton'
import { WALLET_PIN_LENGTH } from '@/api/wallet'
import { cn } from '@/lib/cn'
import { useTransferFlow, type TransferFlow, type TransferPreset } from '../../hooks/useTransferFlow'

type TransferModalProps = { bankId: string | null; balance: number; hasPin: boolean; senderName: string; preset?: TransferPreset; onClose: () => void }

const pinBoxes = 'mx-auto mt-3 flex max-w-[260px] gap-2 sm:gap-3'

function ErrorNote({ message }: { message: string }) {
  return message ? <p role="alert" className="flex items-start gap-2 rounded-xl bg-[#FDECEA] px-3 py-2.5 text-xs font-bold text-[#B23F35]"><AlertCircle size={15} className="mt-px shrink-0"/>{message}</p> : null
}

function SummaryLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={cn('flex items-start justify-between gap-4 text-xs', strong && 'border-t border-[#DEE8E1] pt-3')}>
    <span className="shrink-0 font-semibold text-[#7D8D85]">{label}</span>
    <span className={cn('min-w-0 break-words text-right', strong ? 'text-sm font-black text-[#173A2E]' : 'font-extrabold text-[#29483B]')}>{value}</span>
  </div>
}

function PinSetupStep({ flow }: { flow: TransferFlow }) {
  const { pinSetup } = flow
  return <div className="space-y-6">
    <div className="text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#EDF4EF] text-[#24764F]"><KeyRound size={22}/></span>
      <p className="mt-3 text-sm font-black text-[#173A2E]">Create your wallet PIN</p>
      <p className="mx-auto mt-1 max-w-xs text-xs font-semibold leading-relaxed text-[#8A9C93]">You’ll enter this {WALLET_PIN_LENGTH}-digit PIN to approve every transfer out of the business wallet.</p>
    </div>
    <div>
      <p className="text-center text-[11px] font-extrabold uppercase tracking-wide text-[#82988E]">Choose a PIN</p>
      <OtpInput value={pinSetup.pin} onChange={pinSetup.setPin} length={WALLET_PIN_LENGTH} label="New PIN digit" masked className={pinBoxes}/>
    </div>
    <div>
      <p className="text-center text-[11px] font-extrabold uppercase tracking-wide text-[#82988E]">Confirm PIN</p>
      <OtpInput value={pinSetup.confirm} onChange={pinSetup.setConfirm} length={WALLET_PIN_LENGTH} label="Confirm PIN digit" masked className={pinBoxes}/>
    </div>
    <ErrorNote message={flow.error}/>
    <p className="text-center text-xs font-semibold text-[#8A9C93]">Already set one? <button type="button" onClick={pinSetup.skip} className="font-extrabold text-[#24764F] hover:underline">Continue to transfer</button></p>
  </div>
}

function RecipientStep({ flow }: { flow: TransferFlow }) {
  const { recipient } = flow
  return <div className="space-y-5">
    {(recipient.recentLoading || recipient.recent.length > 0) && <div>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-[#82988E]">Recent beneficiaries</p>
      {recipient.recentLoading
        ? <div className="flex gap-2">{Array.from({ length: 2 }, (_, index) => <Skeleton key={index} className="h-[58px] w-40 rounded-xl"/>)}</div>
        : <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6">{recipient.recent.map(row => {
          const active = row.accountNumber === recipient.accountNumber
          return <button key={`${row.bankCode}-${row.accountNumber}`} type="button" aria-pressed={active} onClick={() => recipient.applyRecent(row)} className={cn('w-44 shrink-0 rounded-xl border p-3 text-left transition', active ? 'border-[#329661] bg-[#F1FAF3]' : 'border-border hover:border-[#BFD9C3]')}>
            <span className="block truncate text-xs font-extrabold text-[#29483B]">{row.accountName || 'Beneficiary'}</span>
            <span className="mt-1 block truncate text-[11px] font-semibold text-[#87968F]">{row.bankName} · {row.accountNumber}</span>
          </button>
        })}</div>}
    </div>}

    <OptionSelect label="Beneficiary bank" placeholder={recipient.banksLoading ? 'Loading banks…' : 'Select a bank'} searchable options={recipient.bankOptions} value={recipient.bankCode} onValueChange={recipient.setBankCode} disabled={recipient.banksLoading}/>

    <Field label="Account number" name="accountNumber" inputMode="numeric" autoComplete="off" placeholder="10-digit account number" value={recipient.accountNumber} onValueChange={recipient.setAccountNumber}
      endAdornment={recipient.resolving ? <Loader2 size={16} className="animate-spin text-[#329661]" aria-label="Checking account"/> : null}/>

    {recipient.resolving && <p className="text-xs font-semibold text-[#8A9C93]">Confirming account name…</p>}
    {!recipient.resolving && recipient.beneficiaryName && <div className="flex min-w-0 items-center gap-2 rounded-xl bg-[#EAF7EE] px-4 py-3 text-xs font-extrabold text-[#1F7046]">
      <CheckCircle2 size={16} className="shrink-0"/><span className="truncate">{recipient.beneficiaryName}</span><span className="hidden truncate font-semibold text-[#6F8A7D] sm:inline">· {recipient.bankName}</span>
    </div>}
    {recipient.resolveFailed && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#FDECEA] px-3 py-2.5 text-xs font-bold text-[#B23F35]">
      <span className="flex items-start gap-2"><AlertCircle size={15} className="mt-px shrink-0"/>{recipient.resolveError}</span>
      <button type="button" onClick={recipient.retryResolve} className="font-extrabold underline">Try again</button>
    </div>}
    <ErrorNote message={flow.error}/>
  </div>
}

function AmountStep({ flow }: { flow: TransferFlow }) {
  const { amount, recipient } = flow
  return <div className="space-y-5">
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border bg-[#FBFCFA] px-4 py-3 text-xs">
      <span className="min-w-0"><span className="block font-semibold text-[#8A9C93]">Sending to</span><span className="block truncate font-extrabold text-[#29483B]">{recipient.beneficiaryName}</span></span>
      <span className="shrink-0 text-right font-semibold text-[#8A9C93]">{recipient.bankName}<br/>{recipient.accountNumber}</span>
    </div>
    <Field label="Amount (₦)" name="amount" inputMode="decimal" autoComplete="off" placeholder="0.00" value={amount.value} onValueChange={amount.set} hint={`Available balance: ${amount.balanceLabel}`}/>
    <div className="space-y-2 rounded-xl bg-[#F2F7F3] p-4">
      <SummaryLine label="Transfer fee" value={amount.feeLabel}/>
      <SummaryLine label="Total to be debited" value={amount.totalLabel} strong/>
      {amount.overBalance && <p className="text-[11px] font-bold text-[#B23F35]">This is more than your available balance.</p>}
    </div>
    <OptionSelect label="Category (optional)" placeholder={amount.categoriesLoading ? 'Loading categories…' : 'Select a category'} options={amount.categoryOptions} value={amount.categoryId} onValueChange={amount.setCategoryId}/>
    <TextareaField label="Narration (optional)" name="narration" rows={2} maxLength={100} placeholder="What is this payment for?" value={amount.narration} onChange={event => amount.setNarration(event.target.value)} hint={`${amount.narration.length}/100`}/>
    <ErrorNote message={flow.error}/>
  </div>
}

function ConfirmStep({ flow }: { flow: TransferFlow }) {
  const { confirm } = flow
  return <div className="space-y-5">
    <div className="space-y-3 rounded-2xl bg-[#F2F7F3] p-4">
      {confirm.summary.map(line => <SummaryLine key={line.label} label={line.label} value={line.value}/>)}
      <SummaryLine label="Total" value={confirm.totalLabel} strong/>
    </div>
    <div>
      <p className="text-center text-[11px] font-extrabold uppercase tracking-wide text-[#82988E]">Enter your {WALLET_PIN_LENGTH}-digit wallet PIN</p>
      <OtpInput value={confirm.pin} onChange={confirm.setPin} length={WALLET_PIN_LENGTH} label="PIN digit" masked className={pinBoxes}/>
    </div>
    <ErrorNote message={flow.error}/>
  </div>
}

function DoneStep({ flow }: { flow: TransferFlow }) {
  const receipt = flow.receipt
  if (!receipt) return null
  return <div>
    <SuccessIcon/>
    <p className="mt-4 text-center text-xs font-extrabold uppercase tracking-wide text-[#82988E]">Transfer successful</p>
    <p className="mt-1 break-words text-center text-3xl font-black text-[#173A2E]">{receipt.amountLabel}</p>
    <div className="mt-6 rounded-2xl border border-border px-4">
      {receipt.rows.map(row => <div key={row.label} className="flex items-start justify-between gap-4 border-b border-[#EDF1EF] py-3 text-xs last:border-0">
        <span className="shrink-0 font-semibold text-[#7D8D85]">{row.label}</span><span className="min-w-0 break-all text-right font-extrabold text-[#29483B]">{row.value}</span>
      </div>)}
    </div>
  </div>
}

const TITLES = { pin: 'Set up wallet PIN', recipient: 'Who are you paying?', amount: 'How much?', confirm: 'Confirm transfer', done: 'Receipt' } as const

/** "Transfer" out of the business wallet — sink-inventory's transfer flow in CLIQBOOK's dialog. */
export function TransferModal(props: TransferModalProps) {
  const flow = useTransferFlow(props)
  const eyebrow = flow.step === 'pin' ? 'Wallet · Security' : flow.step === 'done' ? 'Wallet' : `Transfer · Step ${flow.stepNumber} of ${flow.stepCount}`

  return <Modal open onClose={flow.close} overlayClassName="bg-[#071C14]/55 p-0 backdrop-blur-sm sm:p-4" panelClassName="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-[520px] sm:rounded-[24px]">
    <ModalHeader eyebrow={eyebrow} title={TITLES[flow.step]} onClose={flow.close} className="shrink-0"/>
    {flow.stepNumber > 0 && flow.step !== 'done' && <div className="flex shrink-0 gap-2 px-6 pt-4" aria-hidden="true">
      {Array.from({ length: flow.stepCount }, (_, index) => <span key={index} className={cn('h-1 flex-1 rounded-full', index < flow.stepNumber ? 'bg-[#329661]' : 'bg-[#E3EAE6]')}/>)}
    </div>}
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      {flow.backLabel && <BackLink label={flow.backLabel} onClick={flow.back} className="mb-4"/>}
      {flow.step === 'pin' && <PinSetupStep flow={flow}/>}
      {flow.step === 'recipient' && <RecipientStep flow={flow}/>}
      {flow.step === 'amount' && <AmountStep flow={flow}/>}
      {flow.step === 'confirm' && <ConfirmStep flow={flow}/>}
      {flow.step === 'done' && <DoneStep flow={flow}/>}
    </div>
    <ModalFooter className="pb-[max(1rem,env(safe-area-inset-bottom))]">
      {flow.step === 'pin' && <>
        <Button variant="ghost" onClick={flow.close}>Cancel</Button>
        <Button onClick={flow.pinSetup.submit} disabled={!flow.pinSetup.canSubmit} loading={flow.pinSetup.submitting} className="flex-1 sm:flex-none">Save PIN & continue</Button>
      </>}
      {flow.step === 'recipient' && <>
        <Button variant="ghost" onClick={flow.close}>Cancel</Button>
        <Button onClick={flow.recipient.continue} disabled={!flow.recipient.canContinue} className="flex-1 sm:flex-none">Continue</Button>
      </>}
      {flow.step === 'amount' && <>
        <Button variant="outline" onClick={flow.back}>Back</Button>
        <Button onClick={flow.amount.continue} disabled={!flow.amount.value} className="flex-1 sm:flex-none">Review transfer</Button>
      </>}
      {flow.step === 'confirm' && <>
        <Button variant="outline" onClick={flow.back} disabled={flow.confirm.submitting}>Back</Button>
        <Button onClick={flow.confirm.submit} disabled={flow.confirm.pin.length !== WALLET_PIN_LENGTH} loading={flow.confirm.submitting} className="flex-1 sm:flex-none">{!flow.confirm.submitting && <Send size={16}/>}{flow.confirm.submitting ? 'Sending…' : flow.confirm.sendLabel}</Button>
      </>}
      {flow.step === 'done' && <Button onClick={flow.close} className="w-full sm:w-auto">Done</Button>}
    </ModalFooter>
  </Modal>
}

