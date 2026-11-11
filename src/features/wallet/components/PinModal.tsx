import { KeyRound, Mail } from 'lucide-react'
import type { ReactNode } from 'react'
import { WALLET_PIN_LENGTH } from '@/api/wallet'
import { Button } from '@/components/ui/Button'
import { BackLink } from '@/components/ui/misc'
import { Modal, ModalFooter, ModalHeader } from '@/components/ui/Modal'
import { OtpInput } from '@/components/ui/OtpInput'
import { PIN_RESET_CODE_LENGTH } from '../schemas'
import { usePinFlow, type PinFlow, type PinMode } from '../hooks/usePinFlow'
import { ErrorNote, PinInput } from './walletUi'

function Intro({ icon, title, text }: { icon: ReactNode; title: string; text: ReactNode }) {
  return <div className="text-center">
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#EDF4EF] text-[#24764F]">{icon}</span>
    <p className="mt-3 text-sm font-black text-[#173A2E]">{title}</p>
    <p className="mx-auto mt-1 max-w-xs text-xs font-semibold leading-relaxed text-[#8A9C93]">{text}</p>
  </div>
}

function PinField({ label, value, onChange, ariaLabel }: { label: string; value: string; onChange: (value: string) => void; ariaLabel: string }) {
  return <div>
    <p className="text-center text-[11px] font-extrabold uppercase tracking-wide text-[#82988E]">{label}</p>
    <PinInput value={value} onChange={onChange} label={ariaLabel}/>
  </div>
}

function NewPinFields({ flow }: { flow: PinFlow }) {
  return <>
    <PinField label="New PIN" value={flow.pin} onChange={flow.setPin} ariaLabel="New PIN digit"/>
    <PinField label="Confirm new PIN" value={flow.confirm} onChange={flow.setConfirm} ariaLabel="Confirm PIN digit"/>
  </>
}

function StepBody({ flow }: { flow: PinFlow }) {
  switch (flow.step) {
    case 'set': return <>
      <Intro icon={<KeyRound size={22}/>} title="Protect your wallet" text={`You’ll enter this ${WALLET_PIN_LENGTH}-digit PIN to approve every withdrawal and transfer.`}/>
      <NewPinFields flow={flow}/>
    </>
    case 'change': return <>
      <PinField label="Current PIN" value={flow.current} onChange={flow.setCurrent} ariaLabel="Current PIN digit"/>
      <NewPinFields flow={flow}/>
      <p className="text-center text-xs font-semibold text-[#8A9C93]">Can’t remember it? <button type="button" onClick={flow.forgot} disabled={flow.busy} className="font-extrabold text-[#24764F] hover:underline">Forgot PIN?</button></p>
    </>
    case 'request': return <Intro icon={<Mail size={22}/>} title="Reset your PIN by email" text={<>We’ll send a {PIN_RESET_CODE_LENGTH}-digit code to {flow.email ? <span className="font-extrabold text-[#29483B]">{flow.email}</span> : 'your account email'}. Enter it on the next step to choose a new PIN.</>}/>
    case 'verify': return <>
      <Intro icon={<Mail size={22}/>} title="Check your email" text={<>Enter the {PIN_RESET_CODE_LENGTH}-digit code we sent{flow.email ? <> to <span className="font-extrabold text-[#29483B]">{flow.email}</span></> : ''}.</>}/>
      <div>
        <OtpInput value={flow.code} onChange={flow.setCode} length={PIN_RESET_CODE_LENGTH} label="Code digit" className="mx-auto flex max-w-[360px] gap-2"/>
        <p className="mt-4 text-center text-xs font-semibold text-[#8A9C93]">Didn’t get it? {flow.resend.sending
          ? <span className="font-extrabold text-[#24764F]">Sending…</span>
          : flow.resend.available
            ? <button type="button" onClick={flow.resend.send} className="font-extrabold text-[#24764F] hover:underline">Resend code</button>
            : <span className="font-extrabold text-[#24764F]">Resend in {flow.resend.label}</span>}</p>
      </div>
    </>
    case 'reset': return <>
      <Intro icon={<KeyRound size={22}/>} title="Code verified" text={`Choose a new ${WALLET_PIN_LENGTH}-digit PIN for your wallet.`}/>
      <NewPinFields flow={flow}/>
    </>
  }
}

/** Set, change or reset the wallet's transaction PIN. */
export function PinModal({ mode, onClose }: { mode: PinMode; onClose: () => void }) {
  const flow = usePinFlow({ mode, onClose })
  return <Modal open onClose={flow.close} overlayClassName="bg-[#071C14]/55 p-0 backdrop-blur-sm sm:p-4" panelClassName="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-[460px] sm:rounded-[24px]">
    <ModalHeader eyebrow="Wallet · Security" title={flow.title} onClose={flow.close} className="shrink-0"/>
    <form className="flex min-h-0 flex-1 flex-col" onSubmit={event => { event.preventDefault(); if (flow.primary.ready && !flow.busy) flow.primary.submit() }}>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
        {flow.backLabel && <BackLink label={flow.backLabel} onClick={flow.back}/>}
        <StepBody flow={flow}/>
        <ErrorNote message={flow.error}/>
      </div>
      <ModalFooter className="pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button variant={flow.backLabel ? 'outline' : 'ghost'} onClick={flow.back} disabled={flow.busy}>{flow.backLabel ? 'Back' : 'Cancel'}</Button>
        <Button type="submit" disabled={!flow.primary.ready} loading={flow.primary.loading} className="flex-1 sm:flex-none">{flow.primary.label}</Button>
      </ModalFooter>
    </form>
  </Modal>
}
